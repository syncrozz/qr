/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  HelpCircle,
  LogOut,
  QrCode,
  Share2
} from 'lucide-react';

import { LandingAuth } from './components/LandingAuth';
import { QrGenerator } from './components/QrGenerator';
import { APP_CONFIG } from './config/appConfig';
import {
  signInWithGoogle,
  signOutUser,
  subscribeToAuthState
} from './firebase';
import { downloadQrAsJpg, downloadRemoteImage } from './services/imageExporter';
import { generateQrDataUrl } from './services/qrEngine';
import { sharePlatform } from './services/shareService';
import type { AppState, AuthUser } from './types';

const INITIAL_STATE: AppState = {
  step: 'QR_GENERATOR',
  qrContent: '',
  qrDataUrl: null,
  isGenerating: false,
  errorMessage: null
};

const SUPPORT_QR_URL =
  'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/Bank%20QR/QR%20RYT%20for%20Sumbangan.jpg';

function mapAuthError(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code?: string }).code);
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    ) {
      return '';
    }
    if (code === 'auth/popup-blocked') {
      return 'Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network error while connecting to Google. Please check your connection and try again.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'This domain is not authorized for Google Sign-In in Firebase Authentication settings.';
    }
  }
  return 'Unable to sign in with Google right now. Please try again.';
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isSupportPage, setIsSupportPage] = useState(
    window.location.hash === '#support'
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showHowToPay, setShowHowToPay] = useState<boolean>(false);
  const [isSavingSupportQr, setIsSavingSupportQr] = useState<boolean>(false);
  const [isSupportQrSaved, setIsSupportQrSaved] = useState<boolean>(false);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL
        });
        setAuthError(null);
      } else {
        setUser(null);
        setState(INITIAL_STATE);
      }
      setIsAuthLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setIsSupportPage(window.location.hash === '#support');
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);

    try {
      const firebaseUser = await signInWithGoogle();
      setUser({
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL
      });
      setState(INITIAL_STATE);
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      const message = mapAuthError(error);
      if (message) {
        setAuthError(message);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
      setUser(null);
      setState(INITIAL_STATE);
      showToast('Signed out successfully.');
    } catch (error) {
      console.error('Sign-out failed:', error);
      showToast('Failed to sign out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleGenerate = async (content: string) => {
    setState((current) => ({
      ...current,
      qrContent: content,
      isGenerating: true,
      errorMessage: null
    }));

    try {
      const qrDataUrl = await generateQrDataUrl(content);

      setState((current) => ({
        ...current,
        qrDataUrl,
        isGenerating: false,
        step: 'QR_OUTPUT',
        errorMessage: null
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        isGenerating: false,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Failed to generate QR Code.'
      }));
    }
  };

  const handleBackToGenerator = () => {
    setState((current) => ({
      ...current,
      step: 'QR_GENERATOR',
      errorMessage: null
    }));
  };

  const handleDownload = async () => {
    if (!state.qrDataUrl) return;

    try {
      await downloadQrAsJpg(
        state.qrDataUrl,
        state.qrContent,
        'syncrozz-qr.jpg'
      );
      setIsDownloaded(true);
      showToast('✅ QR Code successfully saved to your device gallery / files.');
      setTimeout(() => setIsDownloaded(false), 4000);
    } catch (error) {
      setState((current) => ({
        ...current,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Failed to download QR Code.'
      }));
    }
  };

  const handleSaveSupportQr = async () => {
    setIsSavingSupportQr(true);
    try {
      await downloadRemoteImage(
        SUPPORT_QR_URL,
        'syncrozz-support-duitnow-qr.jpg'
      );
      setIsSupportQrSaved(true);
      showToast(
        '✅ QR Code saved! Open your banking app and select this image from your gallery.'
      );
      setTimeout(() => setIsSupportQrSaved(false), 4500);
    } catch (error) {
      console.error('Failed to save support QR:', error);
      showToast('Failed to download QR Code. Please try again.');
    } finally {
      setIsSavingSupportQr(false);
    }
  };

  const handleShare = async () => {
    if (!state.qrDataUrl) {
      setState((current) => ({
        ...current,
        errorMessage: 'QR Code is not ready to be shared yet.'
      }));
      return;
    }

    const result = await sharePlatform(
      APP_CONFIG.appName,
      'QR Code generated with SYNCROZZ QR.',
      state.qrDataUrl
    );

    if (result.success) {
      showToast(
        result.method === 'native'
          ? 'Share menu opened!'
          : 'Link copied to clipboard!'
      );
    } else {
      setState((current) => ({
        ...current,
        errorMessage: 'Failed to share QR Code.'
      }));
    }
  };

  if (isSupportPage) {
    return (
      <main className="min-h-screen bg-[#F5FBF8] px-4 py-8 sm:py-12 relative pb-20">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-[#0B132B]/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-100 flex-1 leading-snug">
              {toastMessage}
            </p>
          </div>
        )}

        <div className="mx-auto w-full max-w-lg">
          <header className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00A859] to-[#047857] text-white shadow-lg shadow-emerald-600/20 mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#0B132B]">
              {APP_CONFIG.support.title}
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              {APP_CONFIG.support.description}
            </p>
          </header>

          <section className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-900/5 p-6 sm:p-8">
            <div className="text-center">
              <p className="text-sm text-slate-500 leading-relaxed">
                {APP_CONFIG.support.subDescription}
              </p>
            </div>

            {/* QR Frame */}
            <div className="flex flex-col items-center justify-center mt-6">
              <div className="w-full max-w-[280px] rounded-2xl border-2 border-slate-100 bg-white p-3.5 shadow-sm flex flex-col items-center">
                <img
                  src={SUPPORT_QR_URL}
                  alt="SYNCROZZ DuitNow Support QR Code"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-square object-contain rounded-xl"
                />
              </div>

              <button
                id="btn-save-support-qr"
                type="button"
                onClick={handleSaveSupportQr}
                disabled={isSavingSupportQr}
                className="mt-4 w-full max-w-[280px] inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm shadow-xs transition cursor-pointer"
              >
                {isSupportQrSaved ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Saved to Gallery</span>
                  </>
                ) : isSavingSupportQr ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-[#059669] rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-700" />
                    <span>Save QR Code</span>
                  </>
                )}
              </button>
            </div>

            {/* How To Pay Accordion */}
            <div className="mt-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowHowToPay(!showHowToPay)}
                className="w-full flex items-center justify-between py-2 text-left text-sm font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#059669]" />
                  How to Pay via Gallery
                </span>
                {showHowToPay ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {showHowToPay && (
                <div className="mt-3 p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-2.5 border border-slate-100">
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0 text-[11px] mt-0.5">
                      1
                    </span>
                    <p>
                      Tap the <b>Save QR Code</b> button above to save the QR image to your phone gallery/album.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0 text-[11px] mt-0.5">
                      2
                    </span>
                    <p>
                      Open your banking or e-wallet app (e.g., <b>MAE (Maybank), Touch &apos;n Go eWallet, CIMB OCTO, Bank Islam</b>, etc.).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0 text-[11px] mt-0.5">
                      3
                    </span>
                    <p>
                      Tap <b>Scan QR / DuitNow</b> &gt; select the <b>Gallery / Album</b> icon to upload the saved QR image.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0 text-[11px] mt-0.5">
                      4
                    </span>
                    <p>
                      Enter your contribution amount (e.g., RM1.00) and confirm the payment. Thank you!
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mt-6 pt-4 border-t border-slate-100">
              <p className="text-sm font-bold text-[#0B132B]">
                {APP_CONFIG.support.minimumNote}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.hash = '';
                setIsSupportPage(false);
              }}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to SYNCROZZ QR
            </button>
          </section>

          <footer className="text-center mt-8 text-xs text-slate-400">
            {APP_CONFIG.tagline}
          </footer>
        </div>
      </main>
    );
  }

  if (isAuthLoading) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F6FBF9] px-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00A859] to-[#047857] text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-4">
          <QrCode className="w-6 h-6" />
        </div>
        <div
          className="w-6 h-6 border-2 border-emerald-200 border-t-[#059669] rounded-full animate-spin"
          aria-label="Restoring session"
        />
      </main>
    );
  }

  if (!user) {
    return (
      <LandingAuth
        onGoogleSignIn={handleGoogleSignIn}
        isSigningIn={isSigningIn}
        authError={authError}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#F5FBF8] px-4 py-8 sm:py-12 relative pb-20">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-[#0B132B]/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-100 flex-1 leading-snug">
            {toastMessage}
          </p>
        </div>
      )}

      <div className="mx-auto w-full max-w-2xl">
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00A859] to-[#047857] text-white shadow-lg shadow-emerald-600/20 mb-4">
            <QrCode className="w-6 h-6" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-[#0B132B]">
            GENERATE YOUR QR
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            {APP_CONFIG.tagline}
          </p>
        </header>

        {state.step === 'QR_GENERATOR' && (
          <QrGenerator
            user={user}
            initialContent={state.qrContent}
            isGenerating={state.isGenerating}
            isSigningOut={isSigningOut}
            onGenerate={handleGenerate}
            onSignOut={handleSignOut}
          />
        )}

        {state.step === 'QR_OUTPUT' && state.qrDataUrl && (
          <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 truncate">
                  {user.displayName || user.email}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] mb-4 ring-8 ring-emerald-50/50">
                <QrCode className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-bold text-[#0B132B]">
                QR Code Ready
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Your QR Code has been successfully generated.
              </p>
            </div>

            {/* QR Frame & Save Button */}
            <div className="mt-6 flex flex-col items-center justify-center">
              <div className="rounded-2xl bg-white border-2 border-slate-100 p-4 w-full max-w-sm flex items-center justify-center shadow-xs">
                <img
                  src={state.qrDataUrl}
                  alt="Generated QR Code"
                  className="w-full aspect-square object-contain"
                />
              </div>

              <button
                id="btn-save-generated-qr"
                type="button"
                onClick={handleDownload}
                className="mt-4 w-full max-w-sm inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm shadow-xs transition cursor-pointer"
              >
                {isDownloaded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Saved to Gallery</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-700" />
                    <span>Save QR Code to Gallery</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 mb-1">
                Content
              </p>

              <p className="text-sm text-slate-700 break-all">
                {state.qrContent}
              </p>
            </div>

            {state.errorMessage && (
              <p className="mt-4 text-sm text-rose-600 text-center">
                {state.errorMessage}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-[#059669] hover:bg-[#047857] font-medium transition cursor-pointer shadow-md shadow-emerald-600/20 whitespace-nowrap"
              >
                <Share2 className="w-4 h-4" />
                Share QR Code
              </button>

              <button
                type="button"
                onClick={handleBackToGenerator}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium transition cursor-pointer whitespace-nowrap"
              >
                <ArrowLeft className="w-4 h-4" />
                Generate New QR
              </button>
            </div>

            {/^(https?:\/\/)/i.test(state.qrContent) && (
              <div className="mt-3">
                <a
                  href={state.qrContent}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[#059669] hover:bg-emerald-50 font-medium text-sm transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Link in New Tab
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center mt-8 text-xs text-slate-500">
          <a
            href="#support"
            className="inline-flex items-center gap-1.5 font-medium hover:text-[#059669] transition-colors"
          >
            <span>Support</span>
            <span aria-hidden="true">❤️</span>
          </a>
        </div>

        <footer className="text-center mt-2.5 text-xs text-slate-400">
          Developed by{' '}
          <a
            href="https://sites.google.com/view/khairi-innovation/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-500 hover:text-[#0B132B] hover:underline transition"
          >
            Syncrozz
          </a>
        </footer>
      </div>
    </main>
  );
}
