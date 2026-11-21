import React, { useEffect, useState } from 'react';
import { AlertCircle, LogOut, QrCode, Sparkles } from 'lucide-react';
import { QR_CONTENT_MAX_LENGTH } from '../services/qrHistoryService';
import type { AuthUser } from '../types';

interface QrGeneratorProps {
  user: AuthUser;
  initialContent?: string;
  isGenerating: boolean;
  isSigningOut?: boolean;
  onGenerate: (content: string) => void;
  onSignOut: () => void;
}

export const QrGenerator: React.FC<QrGeneratorProps> = ({
  user,
  initialContent = '',
  isGenerating,
  isSigningOut = false,
  onGenerate,
  onSignOut
}) => {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanContent = content.trim();

    if (!cleanContent) {
      setError('Please enter a link or text first.');
      return;
    }

    if (cleanContent.length > QR_CONTENT_MAX_LENGTH) {
      setError(
        `Content must be ${QR_CONTENT_MAX_LENGTH} characters or fewer.`
      );
      return;
    }

    setError(null);
    onGenerate(cleanContent);
  };

  const displayInitial = (user.displayName || user.email || 'U')
    .charAt(0)
    .toUpperCase();

  return (
    <div
      id="qr-generator-card"
      className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-100 p-6 sm:p-8 transition-all"
    >
      {/* Authenticated Google Profile Bar */}
      <div className="flex items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          {user.photoURL && !avatarFailed ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'Google profile'}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-9 h-9 rounded-full object-cover ring-1 ring-emerald-900/10 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-emerald-50 text-[#059669] font-semibold text-sm flex items-center justify-center ring-1 ring-emerald-200/70 shrink-0">
              {displayInitial}
            </div>
          )}
          <div className="min-w-0">
            {user.displayName && (
              <p className="text-sm font-semibold text-[#0B132B] truncate leading-tight">
                {user.displayName}
              </p>
            )}
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {user.email || 'Signed in with Google'}
            </p>
          </div>
        </div>

        <button
          id="btn-sign-out"
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer disabled:opacity-60 whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-[#059669] mb-4 ring-8 ring-emerald-50/50">
          <QrCode className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-[#0B132B] tracking-tight">
          Generate QR Code
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          Enter the link or text you want to turn into a QR Code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="qr-content-input"
            className="block text-xs font-semibold tracking-wide text-slate-600 mb-2"
          >
            Content / URL
          </label>
          <div className="relative rounded-xl shadow-xs">
            <textarea
              id="qr-content-input"
              rows={3}
              maxLength={QR_CONTENT_MAX_LENGTH}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error) setError(null);
              }}
              placeholder="https://example.com or any text"
              className={`block w-full p-3.5 text-[#0B132B] bg-slate-50/70 placeholder-slate-400 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition text-base resize-none ${
                error
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 focus:ring-emerald-500/20 focus:border-[#059669]'
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
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer whitespace-nowrap"
            >
              + https://
            </button>
            <button
              type="button"
              onClick={() => {
                setContent('https://wa.me/');
                if (error) setError(null);
              }}
              className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer whitespace-nowrap"
            >
              + WhatsApp Link
            </button>
          </div>

          {error && (
            <div
              id="qr-content-error"
              className="flex items-center gap-1.5 text-rose-600 text-xs font-medium mt-2 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <button
          id="btn-generate-qr-submit"
          type="submit"
          disabled={isGenerating}
          className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-white bg-[#059669] hover:bg-[#047857] active:scale-[0.99] font-semibold shadow-md shadow-emerald-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] focus-visible:ring-offset-2 transition duration-150 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
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
