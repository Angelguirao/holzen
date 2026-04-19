// Type declaration for the @khmyznikov/pwa-install custom element
import type { DetailedHTMLProps, HTMLAttributes } from 'react';

interface PWAInstallElement extends HTMLElement {
  showDialog: (forced?: boolean) => void;
  hideDialog: () => void;
  isUnderStandaloneMode: boolean;
  isRelatedAppsInstalled: () => Promise<boolean>;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'pwa-install': DetailedHTMLProps<HTMLAttributes<PWAInstallElement>, PWAInstallElement> & {
        'manifest-url'?: string;
        'install-description'?: string;
        'disable-install-description'?: boolean;
        'disable-screenshots'?: boolean;
        'manual-apple'?: boolean;
        'manual-chrome'?: boolean;
        'icon'?: string;
        'name'?: string;
        'description'?: string;
        ref?: React.Ref<PWAInstallElement>;
      };
    }
  }
}

export type { PWAInstallElement };
