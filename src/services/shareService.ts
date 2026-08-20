/**
 * Share platform with fallback to clipboard copy
 */
export async function sharePlatform(
  title = 'SYNCROZZ QR',
  text = 'Jana QR Code dengan mudah dan percuma menggunakan SYNCROZZ QR.',
  customUrl?: string
): Promise<{ success: boolean; method: 'native' | 'clipboard' }> {
  const url = customUrl || (typeof window !== 'undefined' ? window.location.href : 'https://syncrozz.com');

  // Try native navigator.share if available
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url
      });
      return { success: true, method: 'native' };
    } catch (err: unknown) {
      // If user cancelled, don't fallback to clipboard error
      if (err instanceof Error && err.name === 'AbortError') {
        return { success: true, method: 'native' };
      }
      // Otherwise proceed to fallback
    }
  }

  // Fallback: Copy to clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(`${text} ${url}`);
      return { success: true, method: 'clipboard' };
    } else {
      // Older fallback
      const textArea = document.createElement('textarea');
      textArea.value = `${text} ${url}`;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return { success: true, method: 'clipboard' };
    }
  } catch (copyErr) {
    console.error('Clipboard copy failed:', copyErr);
    return { success: false, method: 'clipboard' };
  }
}
