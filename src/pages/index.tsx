import type { ReactNode } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

import SignManifest from '@site/src/components/SignManifest';
import SignersList from '@site/src/components/SignersList';
import ShareButtons from '@site/src/components/ShareButtons';

import sections from '@site/src/data/readmeSections.json';

import styles from './index.module.css';

export default function Home(): ReactNode {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout title={siteConfig.title} description={siteConfig.tagline}>
            <main className={styles.manifestContainer}>
                <section className={styles.manifestCard}>
                    <header className={styles.manifestHeader}>
                        <Heading as="h1" className={styles.manifestTitle}>
                            <span className={styles.preamble}>Manifesto for</span>
                            <span className={styles.coreSubject}>
                                AI-Augmented <br className={styles.mobileBreak} />
                                Software Craftsmanship
                            </span>
                        </Heading>
                    </header>

                    {/* Manifest only on the home page (Preamble moved to /preamble) */}

                    <article className={styles.manifestContent}>
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {sections['manifesto']?.markdown || 'Manifesto section missing.'}
                        </ReactMarkdown>
                    </article>

                    <div
                        style={{
                            marginTop: '2rem',
                            borderTop: '1px solid rgba(180, 140, 255, 0.12)',
                            paddingTop: '1.5rem',
                        }}
                    >
                        <SignManifest />
                    </div>

                    <div style={{ marginTop: '1.25rem' }}>
                        <h3 style={{ marginBottom: '0.75rem', color: 'var(--manifest-heading-color)' }}>
                            Recent signers
                        </h3>
                        <SignersList />
                    </div>

                    <div
                        style={{
                            textAlign: 'right',
                            marginTop: '1.5rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid rgba(180, 140, 255, 0.12)',
                        }}
                    >
                        <ShareButtons />
                    </div>
                </section>
            </main>
        </Layout>
    );
}
