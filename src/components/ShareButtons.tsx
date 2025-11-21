import React from 'react';
import styles from './ShareButtons.module.css';

interface Props {
    url?: string;
    title?: string;
    compact?: boolean;
}

interface ShareLink {
    name: string;
    icon: string;
    url: string;
    color: string;
}

export default function ShareButtons({
    url = 'https://ai-manifesto.software-craftsmanship.dev',
    title = 'AI-Augmented Software Craftsmanship Manifesto',
    compact = false,
}: Props) {
    // Adjust share text based on compact mode
    const shareText = compact
        ? 'Comprehension over Convenience. Principles for maintaining quality and mastery in the age of AI. #AICraftsmanship #SoftwareDevelopment #Craftsmanship #ResponsibleAI'
        : 'I just signed the Manifesto for AI-Augmented Software Craftsmanship. We commit to Verification over Assumption and Ownership over Delegation. #AICraftsmanship #SoftwareDevelopment #Craftsmanship #ResponsibleAI';

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(shareText);

    const shareLinks = [
        {
            name: 'Twitter / X',
            icon: '𝕏',
            url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            color: '#000000',
        },
        {
            name: 'LinkedIn',
            icon: 'in',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            color: '#0077b5',
        },
        {
            name: 'Bluesky',
            icon: 'B',
            url: `https://bsky.app/intent/compose?text=${encodedText}%0A${encodedUrl}`,
            color: '#1185fe',
        },
        {
            name: 'Mastodon',
            icon: 'M',
            url: `https://mastodon.social/share?text=${encodedText}%0A${encodedUrl}`,
            color: '#6364ff',
        },
        {
            name: 'Threads',
            icon: '@',
            url: `https://threads.net/intent/post?text=${encodedText}%0A${encodedUrl}`,
            color: '#000000',
        },
        {
            name: 'Reddit',
            icon: '↗',
            url: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
            color: '#ff4500',
        },
        {
            name: 'Facebook',
            icon: 'f',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            color: '#1877f2',
        },
        {
            name: 'Email',
            icon: '✉',
            url: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
            color: '#6b3df5',
        },
    ];

    const handleShare = async (link: ShareLink) => {
        if (link.name === 'Email') {
            window.location.href = link.url;
        } else {
            window.open(link.url, '_blank', 'width=600,height=400,noopener,noreferrer');
        }
    };

    const containerClass = compact ? `${styles.container} ${styles.containerCompact}` : styles.container;
    const labelClass = compact ? styles.labelCompact : styles.label;
    const buttonClass = compact ? `${styles.shareButton} ${styles.shareButtonCompact}` : styles.shareButton;

    return (
        <div className={containerClass}>
            {!compact && <span className={labelClass}>Share:</span>}
            {shareLinks.map((link) => (
                <button
                    key={link.name}
                    onClick={() => handleShare(link)}
                    title={`Share on ${link.name}`}
                    className={buttonClass}
                >
                    {link.icon}
                </button>
            ))}
        </div>
    );
}
