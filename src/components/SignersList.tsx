import React, { useEffect, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useSupabase } from '@site/src/utils/supabase';
import styles from './SignersList.module.css';
import mockSignatures from '@site/src/data/mockSignatures.json';
import cachedSignatories from '@site/src/data/cachedSignatories.json';

interface Signer {
    id: string;
    name: string | null;
    avatar_url: string | null;
    profile_url: string | null;
    created_at: string;
    privacy_level: 'full' | 'firstname' | 'anonymous';
    auth_provider?: 'github' | 'linkedin' | 'name_only' | 'unknown';
    name_only_organization?: string | null;
    name_only_role?: string | null;
    name_only_location?: string | null;
}

// Enable mock data only in development environment
// In production, this will be false and real Supabase data will be used
const USE_MOCK_DATA = process.env.NODE_ENV === 'development';

interface SignersListProps {
    variant?: 'compact' | 'full';
    showErrorBanner?: boolean;
}

export default function SignersList({ variant = 'compact', showErrorBanner = false }: SignersListProps) {
    const { siteConfig } = useDocusaurusContext();
    const supabase = useSupabase();

    // Check if we should simulate Supabase being down (for testing)
    const simulateDown = Boolean(siteConfig.customFields?.simulateSupabaseDown);
    const shouldUseMockData = USE_MOCK_DATA && !simulateDown;

    const [signers, setSigners] = useState<Signer[]>(() => (shouldUseMockData ? (mockSignatures as Signer[]) : []));
    const [loading, setLoading] = useState(() => !shouldUseMockData && !!supabase);
    const [error, setError] = useState<string | null>(null);
    const [usingCache, setUsingCache] = useState(false);

    useEffect(() => {
        // Query parameter takes precedence over USE_MOCK_DATA
        if (shouldUseMockData) {
            console.log('Loading mock signatures:', mockSignatures.length, 'entries');
            return;
        }

        if (!supabase) {
            return;
        }

        const load = async () => {
            setLoading(true);
            setError(null);
            setUsingCache(false);

            try {
                // Simulate Supabase being down for testing
                if (simulateDown) {
                    console.warn('🧪 [TEST] Simulating Supabase outage (set SIMULATE_SUPABASE_DOWN=false in .env to disable)');
                    throw new Error('Simulated Supabase outage');
                }

                const { data, error: supabaseError } = await supabase
                    .from('signatures')
                    .select(
                        'id, name, avatar_url, profile_url, created_at, privacy_level, auth_provider, name_only_location'
                    )
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (supabaseError) {
                    throw supabaseError;
                }

                setSigners(data || []);
                console.log('Loaded', data?.length || 0, 'signatures from Supabase');
            } catch (err) {
                console.error('Failed to load signatures from Supabase:', err);
                setError('Connection to Supabase failed');

                // Fallback to cached data
                if (cachedSignatories && cachedSignatories.signatories) {
                    console.log('Falling back to cached data:', cachedSignatories.signatories.length, 'entries');
                    setSigners(cachedSignatories.signatories as Signer[]);
                    setUsingCache(true);
                } else {
                    console.error('No cached data available');
                }
            } finally {
                setLoading(false);
            }
        };
        load();

        const handler = () => load();
        window.addEventListener('signature-changed', handler);
        return () => window.removeEventListener('signature-changed', handler);
    }, [supabase, simulateDown]);

    if (loading) return <div>Loading signers…</div>;

    if (signers.length === 0) {
        console.log('No signers to display');
        return <></>;
    }

    console.log('Rendering', signers.length, 'signers');

    const gridClass = variant === 'full' ? `${styles.grid} ${styles.gridFull}` : styles.grid;

    return (
        <>
            {showErrorBanner && error && usingCache && (
                <div className={styles.errorBanner}>
                    {error}. Showing cached signatories
                    {cachedSignatories.cached_at && (
                        <span className={styles.cacheDate}>
                            {' '}
                            (as of {new Date(cachedSignatories.cached_at).toLocaleString('en-US')})
                        </span>
                    )}
                </div>
            )}
            <h3 className={styles.heading}></h3>
            <div className={styles.container}>
                <ul className={gridClass}>
                    {signers.map((s) => {
                        const isAnon = s.privacy_level === 'anonymous';
                        const isFirstname = s.privacy_level === 'firstname';
                        const isNameOnly = s.auth_provider === 'name_only';

                        // Display name respects privacy level
                        const displayName = isAnon
                            ? 'Anonymous Supporter'
                            : isFirstname
                              ? s.name?.split(' ')[0] || 'Supporter'
                              : s.name;

                        const avatarUrl = isAnon || isNameOnly ? '/img/anonymous-avatar.svg' : s.avatar_url;
                        const profileUrl = isAnon || isFirstname || isNameOnly ? null : s.profile_url;
                        const locationInfo = isNameOnly && s.name_only_location ? s.name_only_location : null;

                        // Build tooltip content based on privacy level
                        const tooltipParts: string[] = [];

                        if (!isAnon) {
                            tooltipParts.push(`Name: ${displayName}`);
                        }

                        if (locationInfo) {
                            tooltipParts.push(`Location: ${locationInfo}`);
                        }

                        tooltipParts.push(`Signed: ${new Date(s.created_at).toLocaleDateString()}`);

                        const tooltipText = tooltipParts.join('\n');

                        return (
                            <li key={s.id} className={styles.signerCard} title={tooltipText}>
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={displayName ?? 'avatar'}
                                        width={32}
                                        height={32}
                                        className={styles.avatar}
                                    />
                                ) : (
                                    <div className={styles.avatarPlaceholder} />
                                )}
                                <div className={styles.signerInfo}>
                                    {profileUrl ? (
                                        <a
                                            href={profileUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={styles.nameLink}
                                        >
                                            {displayName ?? s.id}
                                        </a>
                                    ) : (
                                        <span className={styles.nameText}>{displayName ?? s.id}</span>
                                    )}
                                    {locationInfo && <small className={styles.location}>{locationInfo}</small>}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </>
    );
}
