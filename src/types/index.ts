export type AppStep = 'EMAIL_GATE' | 'QR_GENERATOR' | 'QR_OUTPUT';

export interface AppState {
  step: AppStep;
  email: string;
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
