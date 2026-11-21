import React, { useState } from 'react';
import { AlertCircle, Heart, QrCode, ShieldCheck } from 'lucide-react';

export const OFFICIAL_OGI_URL =
  'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/OGI/OGI.QRv2.jpg';

interface LandingAuthProps {
  onGoogleSignIn: () => Promise<void>;
  isSigningIn: boolean;
  authError: string | null;
}

function GoogleLogo({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

export const LandingAuth: React.FC<LandingAuthProps> = ({
  onGoogleSignIn,
  isSigningIn,
  authError
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <main className="min-h-viewport w-full overflow-x-hidden flex flex-col lg:flex-row lg:items-stretch bg-white text-[#0B132B]">
      {/* LEFT PANEL — OFFICIAL OGI HERO (55% desktop width, ~90% internal image width, exact vertical centre) */}
      <section
        aria-label="SYNCROZZ QR Overview"
        className="w-full lg:w-[55%] lg:min-h-viewport flex items-center justify-center bg-gradient-to-br from-[#F2FBF7] via-[#F9FDFB] to-[#E3F6ED] px-4 py-5 sm:px-6 sm:py-6 lg:px-[5%] lg:py-8 relative"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(16,185,129,0.11),transparent_58%)]"
        />

        <div className="relative z-10 w-full max-w-[460px] sm:max-w-[540px] lg:max-w-[920px] flex items-center justify-center">
          {!imageError ? (
            <img
              src={OFFICIAL_OGI_URL}
              alt="SYNCROZZ QR — Generate, Save, and Share QR Codes"
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
              onError={() => setImageError(true)}
              className="w-full h-auto max-h-[34svh] sm:max-h-[40svh] lg:max-h-[84svh] object-contain rounded-2xl shadow-[0_24px_60px_-20px_rgba(6,95,70,0.18)] ring-1 ring-emerald-950/[0.08]"
            />
          ) : (
            <div className="w-full aspect-[1200/630] rounded-2xl bg-white border border-emerald-200/80 shadow-[0_24px_60px_-20px_rgba(6,95,70,0.14)] flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00A859] to-[#047857] text-white flex items-center justify-center shadow-lg shadow-emerald-600/20 mb-4">
                <QrCode className="w-9 h-9" />
              </div>
              <p className="text-2xl font-extrabold tracking-tight text-[#0B132B]">
                SYNCROZZ <span className="text-[#059669]">QR</span>
              </p>
              <p className="text-sm text-slate-600 mt-1.5">
                Create, Share, Connect.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT PANEL — GOOGLE AUTHENTICATION (45% desktop width, exact vertical centre) */}
      <section
        aria-label="Sign in to SYNCROZZ QR"
        className="w-full lg:w-[45%] lg:min-h-viewport flex-1 lg:flex-none relative flex flex-col items-center justify-center bg-white lg:border-l lg:border-emerald-950/[0.07] px-4 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-8"
      >
        <div className="w-full max-w-[520px]">
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-[0_20px_50px_-24px_rgba(11,19,43,0.12)] p-6 sm:p-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-[#00A859] to-[#047857] text-white shadow-md shadow-emerald-600/20 mb-4">
              <QrCode className="w-5 h-5" />
            </div>

            <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-[#0B132B] leading-tight [text-wrap:balance]">
              Start Creating Your QR Code
            </h1>

            <p className="mt-1.5 text-[15px] text-slate-600 leading-relaxed">
              Create, Share, Connect.
            </p>

            <div className="w-full mt-6">
              <button
                id="btn-google-signin"
                type="button"
                onClick={onGoogleSignIn}
                disabled={isSigningIn}
                className="w-full min-h-[50px] inline-flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white border border-slate-300 text-[#0B132B] font-semibold text-[15px] shadow-xs hover:bg-slate-50 hover:border-emerald-600/40 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 transition duration-150 cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSigningIn ? (
                  <>
                    <span
                      className="w-5 h-5 border-2 border-slate-300 border-t-[#059669] rounded-full animate-spin shrink-0"
                      aria-hidden="true"
                    />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <GoogleLogo className="w-5 h-5 shrink-0" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>

              {authError && (
                <div
                  role="alert"
                  className="mt-3.5 flex items-center justify-center gap-2 rounded-xl bg-rose-50 border border-rose-200/80 px-3.5 py-2.5 text-xs text-rose-700 leading-relaxed text-center"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}
            </div>

            <div className="w-full mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500 leading-relaxed text-center">
              <ShieldCheck
                className="w-4 h-4 text-[#059669] shrink-0"
                aria-hidden="true"
              />
              <p>Your account is securely authenticated with Google.</p>
            </div>
          </div>
        </div>

        <footer className="mt-6 lg:mt-0 lg:absolute lg:bottom-5 lg:inset-x-0 text-center flex flex-col items-center gap-1.5 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-slate-500">
            <a
              href="#support"
              className="inline-flex items-center gap-1.5 font-medium hover:text-[#059669] transition-colors"
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
              <span>Support this project</span>
            </a>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>
              Developed by{' '}
              <a
                href="https://sites.google.com/view/khairi-innovation/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-600 hover:text-[#0B132B] hover:underline transition-colors"
              >
                Syncrozz
              </a>
            </span>
          </div>
        </footer>
      </section>
    </main>
  );
};
