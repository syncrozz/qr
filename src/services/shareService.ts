/**
 * Share QR Code image with native Share API.
 * Falls back to clipboard when file sharing is unavailable.
 */
export async function sharePlatform(
  title: string,
  text: string,
  qrDataUrl: string,
  customUrl?: string
): Promise<{ success: boolean; method: 'native' | 'clipboard' }> {
  const url =
    customUrl ||
    (typeof window !== 'undefined'
      ? window.location.href
      : 'https://syncrozz.com');

  // Convert QR Data URL to JPG File
  const createJpgFile = async (): Promise<File> => {
    const response = await fetch(qrDataUrl);
    const blob = await response.blob();

    return new File([blob], 'syncrozz-qr.jpg', {
      type: 'image/png'
    });
  };

  // Try native file sharing first
  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare
  ) {
    try {
      const jpgFile = await createJpgFile();

      if (
        navigator.canShare({
          files: [jpgFile]
        })
      ) {
        await navigator.share({
          title,
          text,
          files: [jpgFile]
        });

        return {
          success: true,
          method: 'native'
        };
      }
    } catch (err: unknown) {
      // User cancelled native share
      if (err instanceof Error && err.name === 'AbortError') {
        return {
          success: true,
          method: 'native'
        };
      }

      console.error('QR image sharing failed:', err);
    }
  }

  // Fallback: Copy platform URL
  try {
    const shareText = `${text} ${url}`;

    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {
      await navigator.clipboard.writeText(shareText);

      return {
        success: true,
        method: 'clipboard'
      };
    }

    // Older browser fallback
    const textArea = document.createElement('textarea');

    textArea.value = shareText;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);

    textArea.focus();
    textArea.select();

    document.execCommand('copy');

    document.body.removeChild(textArea);

    return {
      success: true,
      method: 'clipboard'
    };
  } catch (error) {
    console.error('Clipboard copy failed:', error);

    return {
      success: false,
      method: 'clipboard'
    };
  }
}