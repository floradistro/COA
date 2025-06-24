'use client';



export default function LiveCOAsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Live COAs
          </h1>
          <p className="text-xl text-gray-600 mt-2">
            Export and manage your official Certificate of Analysis documents
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">Live COAs Coming Soon</h3>
          <p className="text-gray-600">This feature is being updated to fix build compatibility issues.</p>
        </div>
      </div>
    </div>
  );
}

// Force this page to be client-side only to avoid SSR issues with PDF.js and DOMMatrix
export const dynamic = 'force-dynamic';

 