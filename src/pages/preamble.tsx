import React from 'react';
import Layout from '@theme/Layout';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import sections from '@site/src/data/readmeSections.json';
import styles from './preamble.module.css';
import Heading from "@theme/Heading";

export default function PreamblePage() {
    return (
        <Layout title="Preamble" description="Preamble of the AI-Augmented Software Craftsmanship Manifesto">
            <main className={styles.preambleWrapper}>

                <header className={styles.preambleHeader}>
                    <Heading as="h1" className={styles.preambleTitle}>
                        <span className={styles.coreSubject}>
                                Preamble
                            </span>
                    </Heading>
                </header>

                <section className={styles.preambleContent}>
                    <ReactMarkdown className={styles.preambleMarkdown} remarkPlugins={[remarkGfm, remarkBreaks]}>
                        {sections['preamble']?.markdown || 'Preamble section missing.'}
                    </ReactMarkdown>
                </section>
            </main>
        </Layout>
    );
}
