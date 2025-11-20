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


                    <div style={{ marginTop: '1.25rem' }}>
                        <SignersList />
                    </div>

                </section>
            </main>
        </Layout>
    );
}
