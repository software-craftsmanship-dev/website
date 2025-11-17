import React, { useEffect, useState } from 'react';
import { useSupabase } from '@site/src/utils/supabase';

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

export default function SignersList() {
    const supabase = useSupabase();
    const [signers, setSigners] = useState<Signer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!supabase) return;
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

    if (!supabase) return <></>;
    if (loading) return <div>Loading signers…</div>;

    if (signers.length === 0) return <div>No signatures yet. Be the first to sign!</div>;

    return (
        <div className="signersList" style={{ marginTop: '1rem' }}>
            <ul
                style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '8px',
                }}
            >
                {signers.map((s) => {
                    const isAnon = s.privacy_level === 'anonymous';
                    const isFirstname = s.privacy_level === 'firstname';
                    const isNameOnly = s.auth_provider === 'name_only';
                    const displayName = isAnon
                        ? 'Anonymous Supporter'
                        : isFirstname
                          ? s.name?.split(' ')[0] || 'Supporter'
                          : s.name;

                    const avatarUrl = isAnon || isNameOnly ? '/img/anonymous-avatar.svg' : s.avatar_url;
                    const profileUrl = isAnon || isFirstname || isNameOnly ? null : s.profile_url;

                    const locationInfo = isNameOnly && s.name_only_location ? s.name_only_location : null;

                    return (
                        <li
                            key={s.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 8px',
                                border: '1px solid rgba(180,140,255,0.12)',
                                borderRadius: 8,
                                fontSize: '0.85rem',
                            }}
                        >
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt={displayName ?? 'avatar'}
                                    width={24}
                                    height={24}
                                    style={{ borderRadius: '50%', flexShrink: 0 }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        background: 'rgba(180,140,255,0.12)',
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                                {profileUrl ? (
                                    <a
                                        href={profileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            color: 'var(--ifm-color-primary)',
                                            fontSize: '0.85rem',
                                            lineHeight: 1.3,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {displayName ?? s.id}
                                    </a>
                                ) : (
                                    <span
                                        style={{
                                            fontSize: '0.85rem',
                                            lineHeight: 1.3,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {displayName ?? s.id}
                                    </span>
                                )}
                                {locationInfo && (
                                    <small
                                        style={{
                                            opacity: 0.7,
                                            fontSize: '0.7em',
                                            lineHeight: 1.2,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                        }}
                                    >
                                        {locationInfo}
                                    </small>
                                )}
                                <small style={{ opacity: 0.6, fontSize: '0.7em', lineHeight: 1.2 }}>
                                    {new Date(s.created_at).toLocaleDateString()}
                                </small>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
