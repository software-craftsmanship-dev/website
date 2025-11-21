import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { ThemeClassNames } from '@docusaurus/theme-common';
import type { Props } from '@theme/Footer/Layout';
import ShareButtons from '@site/src/components/ShareButtons';
import styles from './FooterLayout.module.css';

export default function FooterLayout({ style, links, logo, copyright }: Props): ReactNode {
    return (
        <footer
            className={clsx(ThemeClassNames.layout.footer.container, 'footer', {
                'footer--dark': style === 'dark',
            })}
        >
            <div className="container container-fluid">
                {links}
                <div className={styles.shareButtonsContainer}>
                    <ShareButtons compact={true} />
                </div>
                {(logo || copyright) && (
                    <div className="footer__bottom text--center">
                        {logo && <div className="margin-bottom--sm">{logo}</div>}
                        {copyright}
                    </div>
                )}
            </div>
        </footer>
    );
}
