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
  QrCode,
  Share2
} from 'lucide-react';

import { EmailGate } from './components/EmailGate';
import { QrGenerator } from './components/QrGenerator';
import { APP_CONFIG } from './config/appConfig';
import { downloadQrAsJpg, downloadRemoteImage } from './services/imageExporter';
import { generateQrDataUrl } from './services/qrEngine';
import { sharePlatform } from './services/shareService';
import type { AppState } from './types';

const INITIAL_STATE: AppState = {
  step: 'EMAIL_GATE',
  email: '',
  qrContent: '',
  qrDataUrl: null,
  isGenerating: false,
  errorMessage: null
};

const SUPPORT_QR_URL =
  'https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/Bank%20QR/QR%20RYT%20for%20Sumbangan.jpg';

export default function App() {
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

  const handleEmailProceed = (email: string) => {
    setState((current) => ({
      ...current,
      email,
      step: 'QR_GENERATOR',
      errorMessage: null
    }));
  };

  const handleChangeEmail = () => {
    setState((current) => ({
      ...current,
      step: 'EMAIL_GATE',
      qrContent: '',
      qrDataUrl: null,
      errorMessage: null
    }));
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
            : 'Gagal menghasilkan QR Code.'
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
      showToast('✅ QR Code berjaya disimpan ke galeri / fail peranti anda.');
      setTimeout(() => setIsDownloaded(false), 4000);
    } catch (error) {
      setState((current) => ({
        ...current,
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Gagal memuat turun QR Code.'
      }));
    }
  };

  const handleSaveSupportQr = async () => {
    setIsSavingSupportQr(true);
    try {
      await downloadRemoteImage(
        SUPPORT_QR_URL,
        'syncrozz-sumbangan-duitnow-qr.jpg'
      );
      setIsSupportQrSaved(true);
      showToast('✅ QR Code berjaya disimpan! Buka aplikasi bank anda dan pilih imej ini dari galeri.');
      setTimeout(() => setIsSupportQrSaved(false), 4500);
    } catch (error) {
      console.error('Failed to save support QR:', error);
      showToast('Gagal memuat turun QR Code. Sila cuba lagi.');
    } finally {
      setIsSavingSupportQr(false);
    }
  };

  const handleShare = async () => {
    if (!state.qrDataUrl) {
      setState((current) => ({
        ...current,
        errorMessage: 'QR Code belum tersedia untuk dikongsi.'
      }));
      return;
    }

    const result = await sharePlatform(
      APP_CONFIG.appName,
      'QR Code yang dijana menggunakan SYNCROZZ QR.',
      state.qrDataUrl
    );

    if (result.success) {
      showToast(
        result.method === 'native'
          ? 'Berjaya membuka menu kongsi!'
          : 'Pautan disalin ke papan keratan (clipboard)!'
      );
    } else {
      setState((current) => ({
        ...current,
        errorMessage: 'Gagal berkongsi QR Code.'
      }));
    }
  };

  if (isSupportPage) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12 relative pb-20">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 mb-3">
              <QrCode className="w-6 h-6" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sokong Inovasi Ini ❤️
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

            {/* Shopee-style QR Frame */}
            <div className="flex flex-col items-center justify-center mt-6">
              <div className="w-full max-w-[280px] rounded-2xl border-2 border-slate-100 bg-white p-3.5 shadow-sm flex flex-col items-center">
                <img
                  src={SUPPORT_QR_URL}
                  alt="QR Code DuitNow Sumbangan SYNCROZZ"
                  className="w-full aspect-square object-contain rounded-xl"
                />
              </div>

              {/* Shopee-style Save QR Code button */}
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
                    <span className="text-emerald-700">Tersimpan di Galeri</span>
                  </>
                ) : isSavingSupportQr ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-indigo-600 rounded-full animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-700" />
                    <span>Save QR Code</span>
                  </>
                )}
              </button>
            </div>

            {/* How To Pay Accordion (Shopee Concept) */}
            <div className="mt-6 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowHowToPay(!showHowToPay)}
                className="w-full flex items-center justify-between py-2 text-left text-sm font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  Cara Bayar Guna Galeri (How To Pay)
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
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold shrink-0 text-[11px] mt-0.5">
                      1
                    </span>
                    <p>
                      Tekan butang <b>Save QR Code</b> di atas untuk simpan imej QR ke galeri/album telefon anda.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold shrink-0 text-[11px] mt-0.5">
                      2
                    </span>
                    <p>
                      Buka aplikasi perbankan anda (cth: <b>MAE (Maybank), Touch 'n Go eWallet, CIMB OCTO, Bank Islam</b> dll).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold shrink-0 text-[11px] mt-0.5">
                      3
                    </span>
                    <p>
                      Tekan butang <b>Scan QR / DuitNow</b> &gt; pilih ikon <b>Galeri / Album</b> untuk muat naik gambar QR tadi.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold shrink-0 text-[11px] mt-0.5">
                      4
                    </span>
                    <p>
                      Masukkan jumlah sumbangan (cth: RM1.00) dan sahkan pembayaran. Terima kasih!
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mt-6 pt-4 border-t border-slate-100">
              <p className="text-sm font-bold text-slate-900">
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
              Kembali ke SYNCROZZ QR
            </button>
          </section>

          <footer className="text-center mt-8 text-xs text-slate-400">
            {APP_CONFIG.tagline}
          </footer>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12 relative pb-20">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 mb-4">
            <QrCode className="w-6 h-6" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {APP_CONFIG.appName}
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            {APP_CONFIG.tagline}
          </p>
        </header>

        {state.step === 'EMAIL_GATE' && (
          <EmailGate
            initialEmail={state.email}
            onProceed={handleEmailProceed}
          />
        )}

        {state.step === 'QR_GENERATOR' && (
          <QrGenerator
            userEmail={state.email}
            initialContent={state.qrContent}
            isGenerating={state.isGenerating}
            onGenerate={handleGenerate}
            onChangeEmail={handleChangeEmail}
          />
        )}

        {state.step === 'QR_OUTPUT' && state.qrDataUrl && (
          <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 p-6 sm:p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mb-4 ring-8 ring-emerald-50/50">
                <QrCode className="w-7 h-7" />
              </div>

              <h2 className="text-2xl font-bold text-slate-900">
                QR Code Siap
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                QR Code anda telah berjaya dijana.
              </p>
            </div>

            {/* Shopee-style QR Frame & Save Button */}
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
                    <span className="text-emerald-700">Tersimpan di Galeri</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-700" />
                    <span>Save QR Code (Simpan ke Galeri)</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Kandungan
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
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-medium transition cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Share2 className="w-4 h-4" />
                Kongsi QR Code
              </button>

              <button
                type="button"
                onClick={handleBackToGenerator}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Jana QR Baharu
              </button>
            </div>

            {/^(https?:\/\/)/i.test(state.qrContent) && (
              <div className="mt-3">
                <a
                  href={state.qrContent}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-indigo-600 hover:bg-indigo-50 font-medium text-sm transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Pautan dalam Tab Baharu
                </a>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center mt-8">
          <a
            href="#support"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium hover:bg-slate-200 hover:text-slate-600 transition-all"
          >
            <span>Sokong Inovasi Ini</span>
            <span aria-hidden="true">❤️</span>
          </a>
        </div>

        <footer className="text-center mt-3 text-xs text-slate-400">
          Developed by{' '}
          <a
            href="https://sites.google.com/view/khairi-innovation/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-500 hover:text-slate-600 hover:underline transition"
          >
            Syncrozz
          </a>
        </footer>
      </div>
    </main>
  );
}