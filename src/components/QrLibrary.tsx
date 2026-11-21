import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FolderOpen,
  QrCode,
  RefreshCw,
  Share2,
  Trash2,
  X
} from 'lucide-react';
import { downloadQrAsJpg } from '../services/imageExporter';
import { generateQrDataUrl } from '../services/qrEngine';
import type { QrHistoryItem } from '../types';

interface QrLibraryProps {
  items: QrHistoryItem[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onRegenerate: (content: string) => void;
  onDelete: (qrId: string) => Promise<void>;
  onShareItem: (item: QrHistoryItem, qrDataUrl: string) => Promise<void>;
  onNotify: (message: string) => void;
}

// Client-side memory cache so QR thumbnails are generated on demand (never stored as Base64 in Firestore)
const qrThumbCache = new Map<string, string>();

function formatDate(date: Date | null): string {
  if (!date) return 'Just now';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch {
    return false;
  }
}

const QrThumbnail: React.FC<{ content: string; title: string }> = ({
  content,
  title
}) => {
  const [src, setSrc] = useState<string | null>(
    () => qrThumbCache.get(content) || null
  );

  useEffect(() => {
    let active = true;
    const cached = qrThumbCache.get(content);
    if (cached) {
      setSrc(cached);
      return;
    }

    generateQrDataUrl(content, { width: 160, margin: 2 })
      .then((url) => {
        qrThumbCache.set(content, url);
        if (active) setSrc(url);
      })
      .catch(() => {
        if (active) setSrc(null);
      });

    return () => {
      active = false;
    };
  }, [content]);

  return (
    <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl bg-white border border-slate-200/80 p-1.5 flex items-center justify-center shrink-0">
      {src ? (
        <img
          src={src}
          alt={`QR Code for ${title}`}
          className="w-full h-full object-contain"
        />
      ) : (
        <QrCode className="w-6 h-6 text-slate-300" aria-hidden="true" />
      )}
    </div>
  );
};

export const QrLibrary: React.FC<QrLibraryProps> = ({
  items,
  isLoading,
  errorMessage,
  onRetry,
  onRegenerate,
  onDelete,
  onShareItem,
  onNotify
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [previewItem, setPreviewItem] = useState<QrHistoryItem | null>(null);
  const [previewQrDataUrl, setPreviewQrDataUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!previewItem) {
      setPreviewQrDataUrl(null);
      return;
    }

    let active = true;
    setIsPreviewLoading(true);

    generateQrDataUrl(previewItem.content)
      .then((url) => {
        if (active) {
          setPreviewQrDataUrl(url);
          setIsPreviewLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setPreviewQrDataUrl(null);
          setIsPreviewLoading(false);
          onNotify('Failed to render QR preview.');
        }
      });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      active = false;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [previewItem, onNotify]);

  const handleCopy = async (item: QrHistoryItem) => {
    const ok = await copyTextToClipboard(item.content);
    if (ok) {
      setCopiedId(item.id);
      onNotify('QR content copied to clipboard.');
      setTimeout(() => {
        setCopiedId((current) => (current === item.id ? null : current));
      }, 2500);
    } else {
      onNotify('Failed to copy content.');
    }
  };

  const handleDownloadItem = async (item: QrHistoryItem) => {
    setDownloadingId(item.id);
    try {
      const highResUrl = await generateQrDataUrl(item.content);
      const safeFileSlug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
      await downloadQrAsJpg(
        highResUrl,
        item.content,
        `syncrozz-qr-${safeFileSlug || 'code'}.jpg`
      );
      onNotify('✅ QR Code saved to your device.');
    } catch {
      onNotify('Failed to download QR Code.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmDelete = async (qrId: string) => {
    setDeletingId(qrId);
    try {
      await onDelete(qrId);
      setConfirmDeleteId(null);
      if (previewItem?.id === qrId) {
        setPreviewItem(null);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section
      id="my-qr-library"
      aria-labelledby="qr-library-heading"
      className="w-full max-w-2xl mx-auto mt-10"
    >
      <div className="flex items-baseline justify-between gap-4 mb-4 px-1">
        <div>
          <h2
            id="qr-library-heading"
            className="text-lg font-bold tracking-tight text-[#0B132B]"
          >
            My QR Library
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Synced privately to your Google account across devices
          </p>
        </div>

        {!isLoading && !errorMessage && items.length > 0 && (
          <span className="text-xs font-medium text-slate-500 tabular-nums shrink-0">
            {items.length} {items.length === 1 ? 'saved QR' : 'saved QRs'}
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          aria-label="Loading QR Library"
          className="space-y-3"
        >
          {[0, 1, 2].map((skeleton) => (
            <div
              key={skeleton}
              className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 animate-pulse"
            >
              <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0" />
              <div className="flex-1 space-y-2.5 min-w-0">
                <div className="h-4 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && errorMessage && (
        <div
          role="alert"
          className="bg-white rounded-2xl border border-rose-200/80 p-6 text-center shadow-xs"
        >
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-rose-50 text-rose-600 mb-3">
            <AlertCircle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-[#0B132B]">
            Unable to load your QR Library
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            {errorMessage}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#0B132B] transition cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !errorMessage && items.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center shadow-xs">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-[#059669] mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-[#0B132B]">
            No saved QR Codes yet
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Generate your first QR Code above and it will be saved automatically
            here for quick access anytime.
          </p>
        </div>
      )}

      {/* Saved QR History List (Newest First) */}
      {!isLoading && !errorMessage && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const isCopied = copiedId === item.id;
            const isDownloading = downloadingId === item.id;
            const isConfirmingDelete = confirmDeleteId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <article
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/75 hover:border-emerald-600/30 shadow-xs transition-colors p-4"
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    aria-label={`Preview QR Code for ${item.title}`}
                    className="cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#059669] shrink-0"
                  >
                    <QrThumbnail content={item.content} title={item.title} />
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#0B132B] truncate">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {item.content}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1.5 tabular-nums">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#059669] transition cursor-pointer whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadItem(item)}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#059669] transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? 'Saving...' : 'Download'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRegenerate(item.content)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-[#059669] transition cursor-pointer whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Regenerate</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer whitespace-nowrap"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#059669]" />
                          <span className="text-[#059669]">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Delete / Inline Confirmation */}
                  {isConfirmingDelete ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleConfirmDelete(item.id)}
                        disabled={isDeleting}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(item.id)}
                      aria-label={`Delete ${item.title}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* High-Resolution QR Preview Modal */}
      {previewItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-preview-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B132B]/55 backdrop-blur-xs p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-7 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h3
                  id="qr-preview-modal-title"
                  className="text-lg font-bold text-[#0B132B] truncate"
                >
                  {previewItem.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                  {formatDate(previewItem.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                aria-label="Close preview"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-white border-2 border-slate-100 p-4 flex items-center justify-center aspect-square max-w-[280px] mx-auto">
              {isPreviewLoading ? (
                <div className="w-7 h-7 border-2 border-emerald-200 border-t-[#059669] rounded-full animate-spin" />
              ) : previewQrDataUrl ? (
                <img
                  src={previewQrDataUrl}
                  alt={`QR Code for ${previewItem.title}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <QrCode className="w-12 h-12 text-slate-300" />
              )}
            </div>

            <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
              <p className="text-[11px] font-semibold tracking-wide text-slate-500 mb-1">
                Content
              </p>
              <p className="text-xs text-slate-700 break-all leading-relaxed">
                {previewItem.content}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => handleDownloadItem(previewItem)}
                disabled={downloadingId === previewItem.id}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold transition cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JPG</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (previewQrDataUrl) {
                    void onShareItem(previewItem, previewQrDataUrl);
                  }
                }}
                disabled={!previewQrDataUrl}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(previewItem)}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
              >
                {copiedId === previewItem.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                    <span className="text-[#059669]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Content</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const targetContent = previewItem.content;
                  setPreviewItem(null);
                  onRegenerate(targetContent);
                }}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>

            {/^(https?:\/\/)/i.test(previewItem.content) && (
              <a
                href={previewItem.content}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium text-[#059669] hover:bg-emerald-50 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Link in New Tab</span>
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
