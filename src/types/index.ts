export type AppStep = 'QR_GENERATOR' | 'QR_OUTPUT';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AppState {
  step: AppStep;
  qrContent: string;
  qrDataUrl: string | null;
  isGenerating: boolean;
  errorMessage: string | null;
}

export interface AppConfig {
  appName: string;
  tagline: string;
  subTagline: string;
  innovationLandingUrl: string;
  support: {
    title: string;
    description: string;
    subDescription: string;
    minimumNote: string;
    bankName: string;
    accountHolder: string;
    accountNumber: string;
    qrImagePlaceholder: string;
  };
  privacyNotice: string;
}
