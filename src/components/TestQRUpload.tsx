'use client'

import React, { useState } from 'react'
import { generateQrCode } from '@/lib/generateQrCode'
import { uploadPdfToSupabase } from '@/lib/uploadPdfToSupabase'
import { PDFDocument, rgb } from 'pdf-lib'

export default function TestQRUpload() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ qrCode?: string; pdfUrl?: string }>({})
  const [error, setError] = useState<string>('')

  const testQRAndUpload = async () => {
    setLoading(true)
    setError('')
    setResult({})

    try {
      // Create a simple test PDF
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([600, 800])
      
      page.drawText('Test COA Document', {
        x: 50,
        y: 750,
        size: 30,
        color: rgb(0, 0, 0),
      })
      
      page.drawText('Sample ID: TEST-123', {
        x: 50,
        y: 700,
        size: 16,
        color: rgb(0, 0, 0),
      })

      // Save initial PDF
      const pdfBytes = await pdfDoc.save()
      const fileName = `TEST_COA_${Date.now()}.pdf`
      
      // Upload to Supabase
      const publicUrl = await uploadPdfToSupabase(fileName, Buffer.from(pdfBytes))
      console.log('Uploaded to:', publicUrl)
      
      // Generate QR code
      const qrCodeDataUrl = await generateQrCode(publicUrl)
      console.log('QR code generated')
      
      // Add QR code to PDF
      const qrImageBytes = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64')
      const qrImage = await pdfDoc.embedPng(qrImageBytes)
      
      page.drawImage(qrImage, {
        x: 450,
        y: 680,
        width: 100,
        height: 100,
      })
      
      page.drawText('Scan for digital copy', {
        x: 450,
        y: 660,
        size: 10,
        color: rgb(0, 0, 0),
      })
      
      // Save final PDF with QR code
      const finalPdfBytes = await pdfDoc.save()
      
      // Re-upload the version with QR code
      const finalUrl = await uploadPdfToSupabase(fileName, Buffer.from(finalPdfBytes))
      
      setResult({
        qrCode: qrCodeDataUrl,
        pdfUrl: finalUrl
      })
      
    } catch (err: unknown) {
      console.error('Test failed:', err)
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Test QR Code & Supabase Upload</h2>
      
      <button
        onClick={testQRAndUpload}
        disabled={loading}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Testing...' : 'Run Test'}
      </button>
      
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}
      
      {result.qrCode && (
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Generated QR Code:</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={result.qrCode} alt="QR Code" className="w-48 h-48 border border-gray-300" />
          </div>
          
          {result.pdfUrl && (
            <div>
              <h3 className="font-semibold mb-2">PDF URL:</h3>
              <a 
                href={result.pdfUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
              >
                {result.pdfUrl}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 