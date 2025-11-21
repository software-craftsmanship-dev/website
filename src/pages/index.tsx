import type { ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

import SignersList from '@site/src/components/SignersList';

import sections from '@site/src/data/readmeSections.json';

import styles from './index.module.css';

function splitManifest(manifestMarkdown?: string) {
    const empty = { before: '', values: [] as { left: string; right: string }[], after: '' };
    if (!manifestMarkdown) return empty;
    const lines = manifestMarkdown.split(/\r?\n/);
    const isValue = (l: string) => /\*\*.+\*\*\s+over\s+.+/i.test(l.trim());

    let start = -1;
    let end = -1;
    for (let i = 0; i < lines.length; i++) {
        if (isValue(lines[i])) {
            start = i;
            break;
        }
    }
    if (start === -1) {
        return { before: manifestMarkdown, values: [], after: '' };
    }
    // capture consecutive value lines, skipping empty lines between groups gracefully
    end = start;
    while (end < lines.length && (isValue(lines[end]) || lines[end].trim() === '')) {
        end++;
    }
    // Build parts
    const before = lines.slice(0, start).join('\n').trim();
    const rawValues = lines.slice(start, end).filter(isValue);
    const values = rawValues
        .map((line) => {
            const m = /\*\*(.+)\*\*\s+over\s+(.+)/i.exec(line.trim());
            return m ? { left: m[1], right: m[2] } : null;
        })
        .filter(Boolean) as { left: string; right: string }[];
    const after = lines.slice(end).join('\n').trim();
    return { before, values, after };
}

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();
    const manifestoMd = sections['manifesto']?.markdown;
    const parts = splitManifest(manifestoMd);

    return (
        <Layout title={siteConfig.title} description={siteConfig.tagline}>
            <main className={styles.manifestContainer}>
                <section className={styles.manifestCard}>
                    <header className={styles.manifestHeader}>
                        <Heading as="h1" className={styles.manifestTitle}>
                            <span className={styles.preamble}>Manifesto for</span>
                            <span className={styles.coreSubject}>AI-Augmented Software Craftsmanship</span>
                        </Heading>
                    </header>

                    {/* Intro text before values (from README) */}
                    {parts.before && (
                        <article className={styles.manifestContent}>
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{parts.before}</ReactMarkdown>
                        </article>
                    )}

                    {/* Highlighted values grid */}
                    {parts.values.length > 0 && (
                        <div className={styles.manifestValues}>
                            {parts.values.map((v) => (
                                <div key={v.left} className={styles.manifestValueItem}>
                                    <span>
                                        {v.left} <small className={styles.overText}>over</small> {v.right}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Text after the values (e.g., "We pursue the values on the left…") */}
                    {parts.after && (
                        <article className={styles.manifestContent}>
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{parts.after}</ReactMarkdown>
                        </article>
                    )}

                    <SignersList />
                </section>
            </main>
        </Layout>
    );
}
