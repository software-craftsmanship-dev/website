DO $$
DECLARE
r RECORD;
BEGIN

FOR r IN (
        SELECT oid::regprocedure as func_signature
        FROM pg_proc
        WHERE proname = 'create_name_only_signature'
        AND pronamespace = 'public'::regnamespace  -- Nur im public schema
    )
    LOOP

        RAISE NOTICE 'Dropping function: %', r.func_signature;
EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
END LOOP;
END $$;

DROP TABLE IF EXISTS public.signatures CASCADE;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS public.signatures CASCADE;

CREATE TABLE IF NOT EXISTS public.signatures (
                                                 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,

    name text NOT NULL CHECK (char_length(TRIM(name)) >= 2 AND char_length(TRIM(name)) <= 120),
    avatar_url text,
    profile_url text,

    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),

    privacy_level text DEFAULT 'full' CHECK (privacy_level IN ('full', 'firstname', 'anonymous')),
    auth_provider text DEFAULT 'github',

    name_only_location text CHECK (char_length(name_only_location) <= 120)
    );

ALTER TABLE public.signatures
    ADD CONSTRAINT signatures_user_id_key UNIQUE (user_id);

CREATE INDEX IF NOT EXISTS idx_signatures_user_id ON public.signatures(user_id);

-- 3. RLS & POLICIES
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- FIX: remove all policies first
DROP POLICY IF EXISTS "Anyone can read signatures" ON public.signatures;
DROP POLICY IF EXISTS "Auth users can insert own signature" ON public.signatures;
DROP POLICY IF EXISTS "Auth users can update own signature" ON public.signatures;
DROP POLICY IF EXISTS "Auth users can delete own signature" ON public.signatures;
DROP POLICY IF EXISTS "Public read access" ON public.signatures;

-- SELECT: public read for all (anon + authenticated)
CREATE POLICY "Public read access"
ON public.signatures FOR SELECT
                                                             TO anon, authenticated
                                                             USING (true);

-- INSERT: only authenticated Users can create signature
CREATE POLICY "Auth users can insert own signature"
ON public.signatures FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: only authenticated Users can update signature
CREATE POLICY "Auth users can update own signature"
ON public.signatures FOR UPDATE
                                           TO authenticated
                                           USING (auth.uid() = user_id)
                         WITH CHECK (auth.uid() = user_id);

-- DELETE: only authenticated Users can delete signature
CREATE POLICY "Auth users can delete own signature"
ON public.signatures FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. FUNKTIONEN (Captcha)
CREATE OR REPLACE FUNCTION generate_captcha_challenge()
RETURNS JSON AS $$
DECLARE
v_num1 INTEGER;
  v_num2 INTEGER;
  v_answer INTEGER;
  v_question TEXT;
BEGIN
  v_num1 := floor(random() * 10 + 1)::INTEGER;
  v_num2 := floor(random() * 10 + 1)::INTEGER;

  IF random() > 0.5 THEN
    v_answer := v_num1 + v_num2;
    v_question := v_num1::TEXT || ' + ' || v_num2::TEXT;
ELSE
    IF v_num1 < v_num2 THEN v_num1 := v_num1 + v_num2; END IF;
    v_answer := v_num1 - v_num2;
    v_question := v_num1::TEXT || ' - ' || v_num2::TEXT;
END IF;

RETURN json_build_object(
        'question', v_question,
        'answer_hash', encode(digest(v_answer::TEXT || '-manifesto-salt-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), 'sha256'), 'hex')
       );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validate_captcha_answer(p_answer TEXT, p_answer_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
v_salt_today TEXT;
  v_salt_yesterday TEXT;
  v_hash_today TEXT;
  v_hash_yesterday TEXT;
BEGIN
  v_salt_today := '-manifesto-salt-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD');
  v_salt_yesterday := '-manifesto-salt-' || TO_CHAR(CURRENT_DATE - INTERVAL '1 day', 'YYYY-MM-DD');

  v_hash_today := encode(digest(TRIM(p_answer) || v_salt_today, 'sha256'), 'hex');
  v_hash_yesterday := encode(digest(TRIM(p_answer) || v_salt_yesterday, 'sha256'), 'hex');

RETURN (v_hash_today = p_answer_hash) OR (v_hash_yesterday = p_answer_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC FUNKTION (Insert)
CREATE OR REPLACE FUNCTION create_name_only_signature(
  p_name TEXT,
  p_location TEXT DEFAULT NULL,
  p_privacy_level TEXT DEFAULT 'full',
  p_captcha_answer TEXT DEFAULT NULL,
  p_captcha_hash TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
v_result JSON;
BEGIN
  -- 1. Captcha Check
  IF p_captcha_answer IS NULL OR p_captcha_hash IS NULL THEN RAISE EXCEPTION 'Captcha required'; END IF;
  IF NOT validate_captcha_answer(p_captcha_answer, p_captcha_hash) THEN RAISE EXCEPTION 'Invalid captcha'; END IF;

  -- 2. Input Validation
  IF p_name IS NULL OR char_length(TRIM(p_name)) < 2 OR char_length(TRIM(p_name)) > 120 THEN
    RAISE EXCEPTION 'Name validation failed';
END IF;

  -- 3. Validate privacy_level
  IF p_privacy_level NOT IN ('full', 'firstname', 'anonymous') THEN
    RAISE EXCEPTION 'Invalid privacy level';
END IF;

  -- 4. Insert signature
INSERT INTO signatures (
    name,
    user_id,
    privacy_level,
    auth_provider,
    name_only_location
) VALUES (
             TRIM(p_name),
             NULL,
             p_privacy_level,
             'name_only',
             CASE WHEN TRIM(COALESCE(p_location, '')) = '' THEN NULL ELSE TRIM(p_location) END
         )
    RETURNING json_build_object('id', id, 'name', name, 'created_at', created_at) INTO v_result;

RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

create or replace function delete_my_account()
returns void
language plpgsql
security definer
as $$
begin

  if auth.uid() is null then
    raise exception 'Not logged in';
end if;

delete from auth.users where id = auth.uid();
end;
$$;

GRANT EXECUTE ON FUNCTION delete_my_account TO authenticated;


-- 6. GRANTS
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT ALL ON TABLE public.signatures TO postgres, service_role;
GRANT SELECT ON TABLE public.signatures TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.signatures TO authenticated;

GRANT EXECUTE ON FUNCTION generate_captcha_challenge TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_captcha_answer TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_name_only_signature TO anon, authenticated;