'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { generateQrCode } from '@/lib/generateQrCode'

export default function DebugQRPage() {
  const [testUrl, setTestUrl] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [error, setError] = useState('')
  const [urlTestResult, setUrlTestResult] = useState<{url: string, status: number, ok: boolean} | null>(null)
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://elhsobjvwmjfminxxcwy.supabase.co'
  const storageUrl = `${supabaseUrl}/storage/v1/object/public/coas/`

  const generateTestQR = async () => {
    try {
      setError('')
      const url = testUrl || `${storageUrl}pdfs/test_${Date.now()}.pdf`
      const qrDataUrl = await generateQrCode(url)
      setQrCode(qrDataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code')
    }
  }

  const testUrlAccessibility = async () => {
    if (!testUrl) {
      setError('Please enter a URL to test')
      return
    }
    
    try {
      setError('')
      setUrlTestResult(null)
      
      console.log('Testing URL accessibility:', testUrl)
      const response = await fetch(testUrl, { method: 'HEAD' })
      
      setUrlTestResult({
        url: testUrl,
        status: response.status,
        ok: response.ok
      })
      
      console.log('URL test result:', response.status, response.statusText)
    } catch (err) {
      console.error('URL test failed:', err)
      setError(err instanceof Error ? err.message : 'URL test failed')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">QR Code Debug Tool</h1>
      
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Environment Info</h2>
        <div className="space-y-2 text-sm">
          <div><span className="font-medium">Supabase URL:</span> {supabaseUrl}</div>
          <div><span className="font-medium">Storage URL:</span> {storageUrl}</div>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">Test URL</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Paste your Supabase storage URL here to test"
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={testUrlAccessibility}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Test URL
          </button>
        </div>
        
        <button
          onClick={generateTestQR}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Generate QR Code
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {urlTestResult && (
        <div className="mb-8 p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">URL Test Result</h3>
          <div className={`p-3 rounded ${urlTestResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            <div><strong>URL:</strong> {urlTestResult.url}</div>
            <div><strong>Status:</strong> {urlTestResult.status}</div>
            <div><strong>Accessible:</strong> {urlTestResult.ok ? 'Yes ✅' : 'No ❌'}</div>
          </div>
          
          {!urlTestResult.ok && (
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded">
              <h4 className="font-medium">Troubleshooting:</h4>
              <ul className="list-disc list-inside mt-2 text-sm">
                <li>Check if the Supabase storage bucket &apos;coas&apos; exists</li>
                <li>Ensure the bucket is set to PUBLIC</li>
                <li>Verify the file actually exists at this path</li>
                <li>Check your Supabase storage policies</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {qrCode && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generated QR Code:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border p-4 rounded-lg">
              <h4 className="font-medium mb-2">Small (64x64)</h4>
              <Image src={qrCode} alt="QR Code" className="w-16 h-16" width={64} height={64} />
            </div>
            
            <div className="border p-4 rounded-lg">
              <h4 className="font-medium mb-2">Medium (128x128)</h4>
              <Image src={qrCode} alt="QR Code" className="w-32 h-32" width={128} height={128} />
            </div>
            
            <div className="border p-4 rounded-lg">
              <h4 className="font-medium mb-2">Large (256x256)</h4>
              <Image src={qrCode} alt="QR Code" className="w-64 h-64" width={256} height={256} />
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">QR Code Data:</h4>
            <div className="text-xs break-all">{qrCode.substring(0, 100)}...</div>
          </div>
        </div>
      )}
    </div>
  )
} 