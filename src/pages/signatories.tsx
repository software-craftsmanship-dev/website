import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SignManifest from '@site/src/components/SignManifest';
import SignersList from '@site/src/components/SignersList';
import styles from './index.module.css';

export default function SignatoriesPage() {
    return (
        <Layout title="Signatories" description="People who signed the manifesto">
            <main className={styles.manifestContainer}>
                <section className={styles.manifestCard}>
                    <header className={styles.manifestHeader}>
                        <Heading as="h1" className={styles.manifestTitle}>
                            <span className={styles.coreSubject}>The Signatories</span>
                        </Heading>
                    </header>

                    <div style={{ marginTop: '1rem' }}>
                        <SignManifest />
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <SignersList />
                    </div>
                </section>
            </main>
        </Layout>
    );
}

