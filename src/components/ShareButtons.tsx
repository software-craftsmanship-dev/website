import React from 'react';

interface Props {
    url?: string;
    title?: string;
    text?: string;
}

export default function ShareButtons({
    url = typeof window !== 'undefined' ? window.location.href : '',
    title = 'AI-Augmented Software Craftsmanship Manifesto',
    text = 'I just signed the AI-Augmented Software Craftsmanship Manifesto. Join me in promoting responsible AI development practices! #AICraftsmanship #SoftwareDevelopment #ResponsibleAI',
}: Props) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(text);

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

    const handleShare = async (link: (typeof shareLinks)[0]) => {
        if (link.name === 'Email') {
            window.location.href = link.url;
        } else {
            window.open(link.url, '_blank', 'width=600,height=400,noopener,noreferrer');
        }
    };

    return (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Share:</span>
            {shareLinks.map((link) => (
                <button
                    key={link.name}
                    onClick={() => handleShare(link)}
                    title={`Share on ${link.name}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: `1px solid rgba(180, 140, 255, 0.3)`,
                        background: 'rgba(180, 140, 255, 0.08)',
                        color: 'var(--ifm-color-primary)',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(180, 140, 255, 0.2)';
                        e.currentTarget.style.borderColor = 'var(--ifm-color-primary)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(180, 140, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(180, 140, 255, 0.3)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    {link.icon}
                </button>
            ))}
        </div>
    );
}
