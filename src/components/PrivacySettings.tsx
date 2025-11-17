import React, { useState, useEffect } from 'react';
import { useSupabase } from '@site/src/utils/supabase';

type PrivacyLevel = 'full' | 'firstname' | 'anonymous';

interface Props {
    userId: string;
    currentLevel: PrivacyLevel;
    onLevelChange: (level: PrivacyLevel) => void;
}

export default function PrivacySettings({ userId, currentLevel, onLevelChange }: Props) {
    const supabase = useSupabase();
    const [level, setLevel] = useState<PrivacyLevel>(currentLevel);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLevel(currentLevel);
    }, [currentLevel]);

    const broadcastSignatureChange = () => {
        try {
            window.dispatchEvent(new CustomEvent('signature-changed'));
        } catch {
            // Ignore errors during broadcast
        }
    };

    const handleSave = async () => {
        if (!supabase) return;
        setSaving(true);
        const { error } = await supabase.from('signatures').update({ privacy_level: level }).eq('user_id', userId); // Check user_id instead of id
        if (error) {
            console.error('Failed to update privacy level', error);
        } else {
            onLevelChange(level);
            broadcastSignatureChange(); // Notify other components
        }
        setSaving(false);
    };

    return (
        <div
            style={{
                marginTop: '1rem',
                padding: '1rem',
                border: '1px solid rgba(180, 140, 255, 0.12)',
                borderRadius: '8px',
            }}
        >
            <h4 style={{ margin: '0 0 0.75rem 0' }}>Privacy Setting</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>
                    <input
                        type="radio"
                        name="privacy"
                        value="full"
                        checked={level === 'full'}
                        onChange={() => setLevel('full')}
                    />{' '}
                    Full Profile (Name & Link)
                </label>
                <label>
                    <input
                        type="radio"
                        name="privacy"
                        value="firstname"
                        checked={level === 'firstname'}
                        onChange={() => setLevel('firstname')}
                    />{' '}
                    First Name Only
                </label>
                <label>
                    <input
                        type="radio"
                        name="privacy"
                        value="anonymous"
                        checked={level === 'anonymous'}
                        onChange={() => setLevel('anonymous')}
                    />{' '}
                    Anonymous
                </label>
            </div>
            <button
                className="button button--primary"
                onClick={handleSave}
                disabled={saving || level === currentLevel}
                style={{ marginTop: '1rem' }}
            >
                {saving ? 'Saving...' : 'Save Setting'}
            </button>
        </div>
    );
}
