import QRCode from 'qrcode'

export async function generateQrCode(dataUrl: string): Promise<string> {
  try {
    // Generate QR code with optimized settings for better scanning
    const qrCodeDataUrl = await QRCode.toDataURL(dataUrl, {
      errorCorrectionLevel: 'M', // Medium error correction (15% can be restored)
      type: 'image/png',
      margin: 2, // White space around QR code
      color: {
        dark: '#000000', // Black modules
        light: '#FFFFFF' // White background
      },
      width: 256 // Higher resolution for better quality
    })
    
    console.log('QR code generated for URL:', dataUrl)
    return qrCodeDataUrl // returns base64 image
  } catch (err) {
    console.error('QR generation error:', err)
    console.error('Failed URL:', dataUrl)
    throw err
  }
} 