import { createClient, SupabaseClient } from '@supabase/supabase-js';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useMemo } from 'react';

export const useSupabase = (): SupabaseClient | null => {
    const { siteConfig } = useDocusaurusContext();

    const supabase = useMemo(() => {
        const supabaseUrl = (siteConfig.customFields as Record<string, unknown>)?.supabaseUrl as string | undefined;
        const supabaseAnonKey = (siteConfig.customFields as Record<string, unknown>)?.supabaseAnonKey as
            | string
            | undefined;

        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn('Supabase URL or anon key is missing. Signing will be disabled.');
            return null;
        }

        return createClient(supabaseUrl, supabaseAnonKey);
    }, [siteConfig.customFields]);

    return supabase;
};
