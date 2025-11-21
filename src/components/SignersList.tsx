import React, { useEffect, useState } from 'react';
import { useSupabase } from '@site/src/utils/supabase';
import styles from './SignersList.module.css';
import mockSignatures from '@site/src/data/mockSignatures.json';

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
}

export default function SignersList({ variant = 'compact' }: SignersListProps) {
    const supabase = useSupabase();
    const [signers, setSigners] = useState<Signer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Always use mock data if enabled
        if (USE_MOCK_DATA) {
            console.log('Loading mock signatures:', mockSignatures.length, 'entries');
            setSigners(mockSignatures as Signer[]);
            setLoading(false);
            return;
        }

        if (!supabase) {
            setLoading(false);
            return;
        }

        const load = async () => {
            const { data, error } = await supabase
                .from('signatures')
                .select(
                    'id, name, avatar_url, profile_url, created_at, privacy_level, auth_provider, name_only_location'
                )
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) {
                console.error('Failed to load signatures', error);
            } else {
                setSigners(data || []);
            }
            setLoading(false);
        };
        load();

        const handler = () => load();
        window.addEventListener('signature-changed', handler);
        return () => window.removeEventListener('signature-changed', handler);
    }, [supabase]);

    if (loading) return <div>Loading signers…</div>;

    if (signers.length === 0) {
        console.log('No signers to display');
        return <></>;
    }

    console.log('Rendering', signers.length, 'signers');

    const gridClass = variant === 'full' ? `${styles.grid} ${styles.gridFull}` : styles.grid;

    return (
        <>
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
                            <li
                                key={s.id}
                                className={styles.signerCard}
                                title={tooltipText}
                            >
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
