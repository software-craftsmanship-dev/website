import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import SignManifest from '@site/src/components/SignManifest';
import SignersList from '@site/src/components/SignersList';
import styles from './signatories.module.css';

export default function SignatoriesPage() {
    return (
        <Layout title="Signatories" description="People who signed the manifesto">
            <main className={styles.signatoriesContainer}>
                <header className={styles.signatoriesHeader}>
                    <Heading as="h1" className={styles.signatoriesTitle}>
                        <span className={styles.coreSubject}>The Signatories</span>
                    </Heading>
                </header>

                <div className={styles.signatureSection}>
                    <SignManifest />
                </div>

                <div className={styles.signersSection}>
                    <SignersList variant="full" />
                </div>
            </main>
        </Layout>
    );
}

