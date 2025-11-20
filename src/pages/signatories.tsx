import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SignManifest from '@site/src/components/SignManifest';
import SignersList from '@site/src/components/SignersList';
import styles from './index.module.css';
import ShareButtons from "@site/src/components/ShareButtons";

export default function SignatoriesPage() {
    return (
        <Layout title="Signatories" description="People who signed the manifesto">
            <main className={styles.manifestContainer}>
                <section className={styles.manifestCard}>
                    <header className={styles.manifestHeader}>
                        <Heading as="h1" className={styles.manifestTitle}>
                            <span className={styles.coreSubject}>The</span>
                            <span className={styles.preamble}>Signatories</span>
                        </Heading>
                    </header>

                    <div style={{ marginTop: '1rem' }}>
                        <SignManifest />
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
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

