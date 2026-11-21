/**
 * Export a high-resolution JPG image from a QR Code Data URL.
 * Adds clean white padding and subtle branding: "Generated with SYNCROZZ QR"
 * Ensuring zero interference with QR scanning readability.
 */
export async function downloadQrAsJpg(
  qrDataUrl: string,
  rawContent: string,
  fileName = 'syncrozz-qr.jpg'
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // High resolution output dimensions
        const qrSize = 800;
        const padding = 60;
        const footerHeight = 120;
        const canvasWidth = qrSize + padding * 2;
        const canvasHeight = qrSize + padding * 2 + footerHeight;

        const canvas = document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        // Fill complete clean white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw QR Code in center
        ctx.drawImage(img, padding, padding, qrSize, qrSize);

        // Draw subtle divider line
        ctx.strokeStyle = '#F1F5F9';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, qrSize + padding + 20);
        ctx.lineTo(canvasWidth - padding, qrSize + padding + 20);
        ctx.stroke();

        // Branding Text: "Generated with SYNCROZZ QR"
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Generated with SYNCROZZ QR', canvasWidth / 2, qrSize + padding + 60);

        // Content subtitle (truncated if too long for elegance)
        ctx.fillStyle = '#64748B';
        ctx.font = '18px system-ui, -apple-system, sans-serif';
        const displayContent = rawContent.length > 50 ? `${rawContent.substring(0, 47)}...` : rawContent;
        ctx.fillText(displayContent, canvasWidth / 2, qrSize + padding + 90);

        // Convert to high quality JPEG
        const jpgDataUrl = canvas.toDataURL('image/jpeg', 0.95);

        // Trigger instant download
        const downloadLink = document.createElement('a');
        downloadLink.href = jpgDataUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        resolve();
      } catch (err) {
        console.error('Error generating JPG:', err);
        reject(err);
      }
    };

    img.onerror = (err) => {
      console.error('Error loading QR image:', err);
      reject(new Error('Failed to download QR Code image.'));
    };

    img.src = qrDataUrl;
  });
}

/**
 * Download any remote image directly to the user's gallery / downloads folder.
 * Works seamlessly with Cross-Origin and mobile browsers.
 */
export async function downloadRemoteImage(
  url: string,
  fileName = 'syncrozz-support-qr.jpg'
): Promise<void> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Network response was not ok');
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas unavailable');
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve();
        } catch {
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve();
        }
      };
      img.onerror = () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        resolve();
      };
      img.src = url;
    });
  }
}
