import QRCode from 'qrcode';

export interface QrOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Generate Static QR Code as Data URL (PNG/Canvas format)
 * Default: High contrast black & white, ample quiet zone (margin = 2).
 */
export async function generateQrDataUrl(
  text: string,
  options: QrOptions = {}
): Promise<string> {
  const defaultOptions: QRCode.QRCodeToDataURLOptions = {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    type: 'image/png',
    margin: options.margin ?? 3,
    scale: 10,
    width: options.width ?? 600,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    }
  };

  try {
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (error) {
    console.error('QR Generation Failed:', error);
    throw new Error('Gagal menghasilkan QR Code. Sila cuba lagi.');
  }
}
