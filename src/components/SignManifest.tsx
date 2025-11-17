import React, { useState, useEffect } from 'react';
import { useSupabase } from '@site/src/utils/supabase';
import PrivacySettings from './PrivacySettings';
import styles from './SignManifest.module.css';
import { Session } from '@supabase/supabase-js';

interface Signature {
    id: string;
    user_id: string;
    name: string;
    avatar_url?: string;
    profile_url?: string;
    privacy_level: 'full' | 'firstname' | 'anonymous';
    auth_provider: string;
    created_at: string;
    updated_at: string;
}

interface CaptchaChallenge {
    question: string;
    answer_hash: string;
}

export function SignManifest() {
    const supabase = useSupabase();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [signature, setSignature] = useState<Signature | null>(null);
    const [checkingSignature, setCheckingSignature] = useState(false);

    // Name-only signature state
    const [showNameOnlyForm, setShowNameOnlyForm] = useState(false);
    const [nameOnlyForm, setNameOnlyForm] = useState({
        name: '',
        location: '',
        privacyLevel: 'full' as 'full' | 'firstname' | 'anonymous',
        agreeToTerms: false,
        captchaAnswer: '',
    });
    const [captchaChallenge, setCaptchaChallenge] = useState<CaptchaChallenge | null>(null);
    const [nameOnlySubmitting, setNameOnlySubmitting] = useState(false);
    const [nameOnlyError, setNameOnlyError] = useState<string | null>(null);
    const [nameOnlySuccess, setNameOnlySuccess] = useState(false);

    // Load session
    useEffect(() => {
        if (!supabase) return;

        const fetchSession = async () => {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error fetching session:', error);
            } else {
                setSession(data.session);
            }
            setLoading(false);
        };

        fetchSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [supabase]);

    // Load captcha challenge when form is shown
    useEffect(() => {
        if (!supabase || !showNameOnlyForm) return;

        const loadCaptcha = async () => {
            try {
                const { data, error } = await supabase.rpc('generate_captcha_challenge');
                if (error) {
                    console.error('Failed to load captcha:', error);
                    setNameOnlyError('Failed to load security challenge. Please try again.');
                } else {
                    setCaptchaChallenge(data);
                    setNameOnlyForm((prev) => ({ ...prev, captchaAnswer: '' }));
                }
            } catch (err) {
                console.error('Captcha load error:', err);
            }
        };

        loadCaptcha();
    }, [supabase, showNameOnlyForm]);

    // Load or create signature for current user
    useEffect(() => {
        if (!supabase || !session?.user) {
            setSignature(null);
            return;
        }

        let isMounted = true;

        const syncSignature = async () => {
            setCheckingSignature(true);
            const user = session.user;
            const meta = user.user_metadata || {};

            const providerRaw = (user.app_metadata?.provider as string | undefined) || '';
            const provider = providerRaw.toLowerCase();
            const isGitHub = provider === 'github';
            const isLinkedIn = provider.startsWith('linkedin');

            const profileUrl = isGitHub
                ? meta.html_url || (meta.user_name ? `https://github.com/${meta.user_name}` : null)
                : isLinkedIn
                  ? meta.profile || null
                  : null;

            const avatarUrl = meta.avatar_url || meta.picture || null;
            const displayName = meta.full_name || meta.name || meta.user_name || user.email || null;

            const { error } = await supabase.from('signatures').select('*').eq('user_id', user.id).maybeSingle();

            if (error) {
                console.warn('Signature sync failed', error);
                setCheckingSignature(false);
                return;
            }

            const baseFields = {
                name: displayName,
                avatar_url: avatarUrl,
                profile_url: profileUrl,
                auth_provider: isGitHub ? 'github' : isLinkedIn ? 'linkedin' : 'unknown',
            };

            const { data: upserted, error: upsertError } = await supabase
                .from('signatures')
                .upsert(
                    {
                        user_id: user.id,
                        privacy_level: 'full',
                        ...baseFields,
                    },
                    {
                        onConflict: 'user_id',
                        ignoreDuplicates: false,
                    }
                )
                .select()
                .single();

            if (!upsertError && isMounted && upserted) {
                setSignature(upserted);

                broadcastSignatureChange();

                try {
                    sessionStorage.setItem('signedUserId', user.id);
                } catch {
                    // SessionStorage might not be available
                }
            }

            if (isMounted) {
                setCheckingSignature(false);
            }
        };

        syncSignature();

        return () => {
            isMounted = false;
        };
    }, [supabase, session]);

    const computeRedirectTo = () => {
        try {
            const origin = window.location.origin; // e.g. http://localhost:3000
            const base = (window as Window & { siteConfigBaseUrl?: string })?.siteConfigBaseUrl || '/';
            return origin + base;
        } catch {
            return undefined;
        }
    };

    const handleLogin = async (provider: 'github' | 'linkedin_oidc') => {
        if (!supabase) return;
        await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: computeRedirectTo(),
            },
        });
    };

    const handleLogout = async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
    };

    const broadcastSignatureChange = () => {
        try {
            window.dispatchEvent(new CustomEvent('signature-changed'));
        } catch {
            // Ignore errors during broadcast
        }
    };

    const submitNameOnlySignature = async () => {
        if (!supabase) return;

        // Session-based rate limiting - will do for now
        try {
            const lastSignature = sessionStorage.getItem('lastNameOnlySignature');
            if (lastSignature) {
                const lastTime = parseInt(lastSignature);
                const timeSince = Date.now() - lastTime;
                const cooldownMinutes = 60; // 1 Stunde
                if (timeSince < cooldownMinutes * 60 * 1000) {
                    const remainingMinutes = Math.ceil((cooldownMinutes * 60 * 1000 - timeSince) / 60000);
                    setNameOnlyError(`Please wait ${remainingMinutes} minute(s) before signing again.`);
                    return;
                }
            }
        } catch (e) {
            // SessionStorage not available
            console.warn('SessionStorage not available:', e);
        }

        // Frontend validation
        if (!nameOnlyForm.name.trim() || nameOnlyForm.name.length < 2 || nameOnlyForm.name.length > 120) {
            setNameOnlyError('Name must be between 2 and 120 characters');
            return;
        }

        if (!nameOnlyForm.agreeToTerms) {
            setNameOnlyError('You must agree to the terms and privacy policy');
            return;
        }

        if (!captchaChallenge || !nameOnlyForm.captchaAnswer.trim()) {
            setNameOnlyError('Please answer the security question.');
            return;
        }

        setNameOnlySubmitting(true);
        setNameOnlyError(null);

        try {
            const params = {
                p_name: nameOnlyForm.name.trim(),
                p_location: nameOnlyForm.location?.trim() || null,
                p_privacy_level: nameOnlyForm.privacyLevel,
                p_captcha_answer: nameOnlyForm.captchaAnswer.trim(),
                p_captcha_hash: captchaChallenge.answer_hash,
            };

            console.log('DEBUG RPC Call params:', params);

            const { data, error } = await supabase.rpc('create_name_only_signature', params);

            console.log('DEBUG RPC Response - data:', data);
            console.log('DEBUG RPC Response - error:', error);

            if (error) {
                if (error.message.includes('captcha') || error.message.includes('Invalid captcha')) {
                    setNameOnlyError('Security answer incorrect. Please try again.');
                    // Reload captcha for new attempt
                    const { data: newCaptcha } = await supabase.rpc('generate_captcha_challenge');
                    if (newCaptcha) setCaptchaChallenge(newCaptcha);
                    setNameOnlyForm((prev) => ({ ...prev, captchaAnswer: '' }));
                } else {
                    setNameOnlyError(error.message || 'Failed to submit signature. Please try again.');
                }
            } else {
                console.log('Signature created:', data);

                // Store timestamp for rate limiting (session-only, DSGVO-konform)
                try {
                    sessionStorage.setItem('lastNameOnlySignature', Date.now().toString());
                } catch (e) {
                    console.warn('Could not save rate limit timestamp:', e);
                }

                setNameOnlySuccess(true);
                setShowNameOnlyForm(false);
                setNameOnlyForm({
                    name: '',
                    location: '',
                    privacyLevel: 'full',
                    agreeToTerms: false,
                    captchaAnswer: '',
                });
                setCaptchaChallenge(null);
                broadcastSignatureChange();
                setTimeout(() => setNameOnlySuccess(false), 5000);
            }
        } catch (err) {
            setNameOnlyError('An unexpected error occurred. Please try again.');
            console.error('Name-only signature error:', err);
        } finally {
            setNameOnlySubmitting(false);
        }
    };

    const withdrawSignature = async () => {
        if (!supabase || !session?.user) return;
        setCheckingSignature(true);

        const { error } = await supabase.rpc('delete_my_account');

        if (error) {
            console.error('Failed to delete account', error);
            // Optional: User informieren
            alert('Fehler beim Löschen des Accounts: ' + error.message);
        } else {

            setSignature(null);
            try { sessionStorage.removeItem('signedUserId'); } catch {}
            broadcastSignatureChange();

            try {
                await supabase.auth.signOut();
            } catch (e) {

            }

            setSession(null);
        }
        setCheckingSignature(false);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    const showSignedState = Boolean(session?.user);
    const showWithdraw = showSignedState && (signature || checkingSignature);
    const signedUserIdLS = (() => {
        try {
            return sessionStorage.getItem('signedUserId');
        } catch {
            return null;
        }
    })();
    const showReLoginNotice = !showSignedState && !!signedUserIdLS;

    // Compute display name based on privacy level
    let displayName = session?.user?.user_metadata?.full_name || session?.user?.email;
    if (signature) {
        if (signature.privacy_level === 'anonymous') {
            displayName = 'Anonymous Supporter';
        } else if (signature.privacy_level === 'firstname') {
            const fullName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || '';
            displayName = fullName.split(' ')[0] || 'Supporter';
        }
    }

    return (
        <div className={styles.signManifest}>
            {showReLoginNotice && (
                <div className={styles.reLoginNotice}>
                    You previously signed. Log in again to withdraw or update your signature.
                </div>
            )}
            {nameOnlySuccess && <div className={styles.successNotice}>✓ Thank you! Your signature has been added.</div>}
            {!showSignedState ? (
                <>
                    <div className={styles.signButtons}>
                        <button className="button button--primary" onClick={() => handleLogin('github')}>
                            Sign with GitHub
                        </button>
                        <button className="button button--secondary" onClick={() => handleLogin('linkedin_oidc')}>
                            Sign with LinkedIn
                        </button>
                        <button
                            className="button button--secondary"
                            style={{ color: '#fff', background: 'none' }}
                            onClick={() => setShowNameOnlyForm(!showNameOnlyForm)}
                        >
                            {showNameOnlyForm ? 'Cancel' : 'Sign with name only'}
                        </button>
                    </div>

                    {showNameOnlyForm && (
                        <div className={styles.nameOnlyForm}>
                            <h4>Sign the Manifesto</h4>
                            <p style={{ fontSize: '0.9em', opacity: 0.8, marginBottom: '1rem' }}>
                                This signature is not linked to an account and cannot be withdrawn later. Your
                                information will be displayed publicly according to your privacy settings.
                            </p>

                            <div className={styles.formGroup}>
                                <label htmlFor="name">Name *</label>
                                <input
                                    id="name"
                                    type="text"
                                    value={nameOnlyForm.name}
                                    onChange={(e) => setNameOnlyForm({ ...nameOnlyForm, name: e.target.value })}
                                    placeholder="Your full name"
                                    maxLength={120}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="location">Location (optional)</label>
                                <input
                                    id="location"
                                    type="text"
                                    value={nameOnlyForm.location}
                                    onChange={(e) => setNameOnlyForm({ ...nameOnlyForm, location: e.target.value })}
                                    placeholder="e.g., Berlin, Germany"
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="privacyLevel">Privacy Level</label>
                                <select
                                    id="privacyLevel"
                                    value={nameOnlyForm.privacyLevel}
                                    onChange={(e) =>
                                        setNameOnlyForm({
                                            ...nameOnlyForm,
                                            privacyLevel: e.target.value as 'full' | 'firstname' | 'anonymous',
                                        })
                                    }
                                >
                                    <option value="full">Full name visible</option>
                                    <option value="firstname">First name only</option>
                                    <option value="anonymous">Anonymous supporter</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="captcha">
                                    Security question:{' '}
                                    {captchaChallenge ? `What is ${captchaChallenge.question}?` : 'Loading...'} *
                                </label>
                                <input
                                    id="captcha"
                                    type="text"
                                    value={nameOnlyForm.captchaAnswer}
                                    onChange={(e) =>
                                        setNameOnlyForm({ ...nameOnlyForm, captchaAnswer: e.target.value })
                                    }
                                    placeholder="Enter the answer"
                                    disabled={!captchaChallenge}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={nameOnlyForm.agreeToTerms}
                                        onChange={(e) =>
                                            setNameOnlyForm({ ...nameOnlyForm, agreeToTerms: e.target.checked })
                                        }
                                        required
                                    />
                                    <span>
                                        I agree to the{' '}
                                        <a href="/privacy" target="_blank">
                                            privacy policy
                                        </a>{' '}
                                        *
                                    </span>
                                </label>
                            </div>

                            {nameOnlyError && <div className={styles.errorMessage}>{nameOnlyError}</div>}

                            <div className={styles.formActions}>
                                <button
                                    className="button button--primary"
                                    onClick={submitNameOnlySignature}
                                    disabled={nameOnlySubmitting}
                                >
                                    {nameOnlySubmitting ? 'Submitting...' : 'Submit Signature'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.signedState}>
                    <p>
                        Signed as <strong>{displayName}</strong>
                    </p>
                    <div className={styles.actionButtons}>
                        <button className="button button--primary" onClick={handleLogout}>
                            Sign out
                        </button>
                        {showWithdraw && (
                            <button
                                className="button button--danger"
                                onClick={withdrawSignature}
                                disabled={checkingSignature}
                            >
                                {checkingSignature ? 'Checking…' : 'Withdraw signature'}
                            </button>
                        )}
                    </div>
                    {signature && (
                        <PrivacySettings
                            userId={session.user.id}
                            currentLevel={signature.privacy_level}
                            onLevelChange={(level) => setSignature({ ...signature, privacy_level: level })}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export default SignManifest;
