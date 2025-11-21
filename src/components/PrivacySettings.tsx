import React, { useState, useEffect } from 'react';
import { useSupabase } from '@site/src/utils/supabase';
import styles from './PrivacySettings.module.css';

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
        const { error } = await supabase.from('signatures').update({ privacy_level: level }).eq('user_id', userId);
        if (error) {
            console.error('Failed to update privacy level', error);
        } else {
            onLevelChange(level);
            broadcastSignatureChange();
        }
        setSaving(false);
    };

    return (
        <div className={styles.container}>
            <h4 className={styles.heading}>Privacy Setting</h4>
            <div className={styles.optionsContainer}>
                <label className={styles.optionLabel}>
                    <input
                        type="radio"
                        name="privacy"
                        value="full"
                        checked={level === 'full'}
                        onChange={() => setLevel('full')}
                    />
                    Full Profile (Name & Link)
                </label>
                <label className={styles.optionLabel}>
                    <input
                        type="radio"
                        name="privacy"
                        value="firstname"
                        checked={level === 'firstname'}
                        onChange={() => setLevel('firstname')}
                    />
                    First Name Only
                </label>
                <label className={styles.optionLabel}>
                    <input
                        type="radio"
                        name="privacy"
                        value="anonymous"
                        checked={level === 'anonymous'}
                        onChange={() => setLevel('anonymous')}
                    />
                    Anonymous
                </label>
            </div>
            <button
                className={`button button--primary ${styles.saveButton}`}
                onClick={handleSave}
                disabled={saving || level === currentLevel}
            >
                {saving ? 'Saving...' : 'Save Setting'}
            </button>
        </div>
    );
}
