import QRCode from 'qrcode'

export async function generateQrCode(dataUrl: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(dataUrl)
    return qrCodeDataUrl // returns base64 image
  } catch (err) {
    console.error('QR generation error:', err)
    throw err
  }
} 