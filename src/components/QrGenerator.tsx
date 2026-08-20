import React, { useState } from 'react';
import { QrCode, Sparkles, AlertCircle, Link, Edit3, ArrowLeft } from 'lucide-react';

interface QrGeneratorProps {
  userEmail: string;
  initialContent?: string;
  isGenerating: boolean;
  onGenerate: (content: string) => void;
  onChangeEmail: () => void;
}

export const QrGenerator: React.FC<QrGeneratorProps> = ({
  userEmail,
  initialContent = '',
  isGenerating,
  onGenerate,
  onChangeEmail
}) => {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = content.trim();

    if (!cleanContent) {
      setError('Sila masukkan pautan atau teks terlebih dahulu.');
      return;
    }

    setError(null);
    onGenerate(cleanContent);
  };

  return (
    <div id="qr-generator-card" className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl shadow-slate-900/5 border border-slate-100 p-6 sm:p-8 transition-all">
      {/* User Context Bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2 text-slate-600 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="truncate font-medium">{userEmail}</span>
        </div>
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Tukar</span>
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-4 ring-8 ring-indigo-50/50">
          <QrCode className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Generate QR Code
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Masukkan pautan atau teks yang ingin dijadikan QR Code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="qr-content-input" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
            Kandungan / URL
          </label>
          <div className="relative rounded-xl shadow-xs">
            <textarea
              id="qr-content-input"
              rows={3}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://example.com atau sebarang teks"
              className={`block w-full p-3.5 text-slate-900 bg-slate-50/70 placeholder-slate-400 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition text-base resize-none ${
                error
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600'
              }`}
              autoFocus
            />
          </div>

          {/* Quick preset helpers */}
          <div className="flex flex-wrap gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => {
                setContent('https://');
                if (error) setError(null);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              + https://
            </button>
            <button
              type="button"
              onClick={() => {
                setContent('https://wa.me/');
                if (error) setError(null);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
            >
              + WhatsApp Link
            </button>
          </div>

          {error && (
            <div id="qr-content-error" className="flex items-center gap-1.5 text-rose-600 text-xs font-medium mt-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <button
          id="btn-generate-qr-submit"
          type="submit"
          disabled={isGenerating}
          className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] font-medium shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate QR Code</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
