/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ArrowLeft, Download, ExternalLink, QrCode, Share2 } from 'lucide-react';

import { EmailGate } from './components/EmailGate';
import { QrGenerator } from './components/QrGenerator';
import { APP_CONFIG } from './config/appConfig';
import { downloadQrAsJpg } from './services/imageExporter';
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

  useEffect(() => {
    const handleHashChange = () => {
      setIsSupportPage(window.location.hash === '#support');
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

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

  const handleShare = async () => {
    const result = await sharePlatform(
      APP_CONFIG.appName,
      'Jana QR Code dengan mudah dan percuma menggunakan SYNCROZZ QR.'
    );

    if (!result.success) {
      setState((current) => ({
        ...current,
        errorMessage: 'Gagal berkongsi platform.'
      }));
    }
  };

  if (isSupportPage) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-lg">
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 mb-4">
              <QrCode className="w-6 h-6" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sokong Inovasi Ini ❤️
            </h1>

            <p className="text-sm text-slate-500 mt-2">
              {APP_CONFIG.support.description}
            </p>
          </header>

          <section className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-900/5 p-6 sm:p-8">
            <div className="text-center">
              <p className="text-sm text-slate-500 leading-relaxed">
                {APP_CONFIG.support.subDescription}
              </p>
            </div>

            <div className="flex justify-center mt-6">
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <img
                  src={SUPPORT_QR_URL}
                  alt="QR Code Sokongan SYNCROZZ"
                  className="w-64 h-64 object-contain"
                />
              </div>
            </div>

            <div className="text-center mt-6">
              <p className="text-lg font-bold text-slate-900">
                {APP_CONFIG.support.minimumNote}
              </p>

              <p className="text-sm text-slate-500 mt-2">
                {APP_CONFIG.support.bankName}
              </p>

              <p className="text-sm font-medium text-slate-700 mt-1">
                {APP_CONFIG.support.accountHolder}
              </p>

              <p className="text-sm text-slate-500 mt-1">
                {APP_CONFIG.support.accountNumber}
              </p>
            </div>

            <a
              href="/"
              className="mt-8 w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke SYNCROZZ QR
            </a>
          </section>

          <footer className="text-center mt-8 text-xs text-slate-400">
            {APP_CONFIG.tagline}
          </footer>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
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
          <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-100 p-6 sm:p-8">
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

            <div className="mt-6 flex justify-center rounded-2xl bg-white border border-slate-100 p-4">
              <img
                src={state.qrDataUrl}
                alt="Generated QR Code"
                className="w-full max-w-sm aspect-square object-contain"
              />
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
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 font-medium transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Muat Turun JPG
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 font-medium transition cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Kongsi
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleBackToGenerator}
                className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Jana QR Baharu
              </button>

              {/^(https?:\/\/)/i.test(state.qrContent) && (
                <a
                  href={state.qrContent}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-indigo-600 hover:bg-indigo-50 font-medium transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Pautan
                </a>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-center mt-8">
  <a
    href="#support"
    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 text-indigo-600 text-sm font-medium shadow-sm hover:bg-indigo-50 hover:border-indigo-200 hover:shadow transition-all"
  >
    <span>Sokong Inovasi Ini</span>
    <span aria-hidden="true">❤️</span>
  </a>
</div>

        <footer className="text-center mt-3 text-xs text-slate-400">
          {APP_CONFIG.tagline}
        </footer>
      </div>
    </main>
  );
}