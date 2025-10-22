'use client'

import { useState, useEffect } from 'react'
import { supabaseVendor, supabaseData } from '@/lib/supabaseClient'
import { Vendor, VendorCOA } from '@/types'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function VendorCOAsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorCOAs, setVendorCOAs] = useState<VendorCOA[]>([])
  const [selectedVendor, setSelectedVendor] = useState<string>('')
  const [selectedVendorData, setSelectedVendorData] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingCoaId, setUploadingCoaId] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [availableCOAs, setAvailableCOAs] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'uploaded'>('all')

  useEffect(() => {
    loadVendors()
  }, [])

  useEffect(() => {
    if (selectedVendor) {
      const vendor = vendors.find(v => v.id === selectedVendor)
      setSelectedVendorData(vendor || null)
      loadVendorCOAs(selectedVendor)
      loadAvailableCOAs()
    } else {
      setVendorCOAs([])
      setSelectedVendorData(null)
      setAvailableCOAs([])
    }
  }, [selectedVendor, vendors])

  const loadVendors = async () => {
    try {
      const { data, error } = await supabaseVendor
        .from('vendors')
        .select('*')
        .eq('status', 'active')
        .order('store_name')

      if (error) throw error
      setVendors(data || [])
    } catch (err) {
      console.error('Error loading vendors:', err)
      setError('Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }

  const loadVendorCOAs = async (vendorId: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabaseVendor
        .from('vendor_coas')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVendorCOAs(data || [])
    } catch (err) {
      console.error('Error loading vendor COAs:', err)
      setError('Failed to load COAs')
    } finally {
      setLoading(false)
    }
  }

  const loadAvailableCOAs = async () => {
    try {
      const { data, error } = await supabaseData
        .from('coa_metadata')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setAvailableCOAs(data || [])
    } catch (err) {
      console.error('Error loading available COAs:', err)
      setAvailableCOAs([])
    }
  }

  const syncVendorAsClient = async () => {
    if (!selectedVendorData) return

    try {
      setSyncing(true)
      setError('')
      setSuccess('')

      const { data: existingClient } = await supabaseData
        .from('clients')
        .select('*')
        .eq('email', selectedVendorData.email)
        .maybeSingle()

      if (existingClient) {
        setError('This vendor is already synced as a client')
        return
      }

      const { error: insertError } = await supabaseData
        .from('clients')
        .insert({
          name: selectedVendorData.store_name,
          address: selectedVendorData.address 
            ? `${selectedVendorData.address}, ${selectedVendorData.city || ''}, ${selectedVendorData.state || ''} ${selectedVendorData.zip || ''}`.trim()
            : null,
          license_number: selectedVendorData.tax_id,
          email: selectedVendorData.email
        })

      if (insertError) throw insertError

      setSuccess(`${selectedVendorData.store_name} synced successfully`)
    } catch (err) {
      console.error('Error syncing vendor as client:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync vendor')
    } finally {
      setSyncing(false)
    }
  }

  const handleUploadSpecificCOA = async (coaMetadata: any) => {
    if (!selectedVendor) return

    try {
      setUploadingCoaId(coaMetadata.id)
      setError('')
      setSuccess('')

      if (!coaMetadata.file_path) {
        throw new Error('COA file path not found')
      }

      const filename = coaMetadata.file_path.endsWith('.pdf') 
        ? coaMetadata.file_path 
        : `${coaMetadata.file_path}.pdf`

      const pdfPath = `pdfs/${filename}`

      const { data: pdfData, error: downloadError } = await supabaseData.storage
        .from('coas')
        .download(pdfPath)

      if (downloadError || !pdfData) {
        throw new Error('PDF file not found in storage')
      }

      const fileName = `${coaMetadata.sample_id || coaMetadata.strain_name || 'COA'}_${coaMetadata.batch_id}.pdf`
      const storagePath = `${selectedVendor}/${Date.now()}_${fileName}`
      
      const { error: uploadError } = await supabaseVendor.storage
        .from('vendor-coas')
        .upload(storagePath, pdfData, {
          contentType: 'application/pdf',
          cacheControl: '3600'
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      const { data: urlData } = supabaseVendor.storage
        .from('vendor-coas')
        .getPublicUrl(storagePath)

      const { error: insertError } = await supabaseVendor
        .from('vendor_coas')
        .insert({
          vendor_id: selectedVendor,
          product_id: null,
          file_name: fileName,
          file_url: urlData.publicUrl,
          file_size: pdfData.size,
          file_type: 'application/pdf',
          lab_name: coaMetadata.lab_name || 'Quantix Analytics',
          test_date: coaMetadata.date_tested,
          batch_number: coaMetadata.batch_id,
          test_results: {
            totalTHC: coaMetadata.total_thc,
            totalCBD: coaMetadata.total_cbd,
            totalCannabinoids: coaMetadata.total_cannabinoids,
            sampleType: coaMetadata.sample_type,
            strain: coaMetadata.strain_name
          },
          is_active: true,
          is_verified: true,
          metadata: {
            client_name: coaMetadata.client_name,
            sample_id: coaMetadata.sample_id,
            strain: coaMetadata.strain_name,
            date_collected: coaMetadata.date_collected,
            date_received: coaMetadata.date_received
          }
        })

      if (insertError) {
        await supabaseVendor.storage.from('vendor-coas').remove([storagePath])
        throw new Error(`Save failed: ${insertError.message}`)
      }

      setSuccess('Uploaded successfully')
      loadVendorCOAs(selectedVendor)
    } catch (err) {
      console.error('Error uploading COA:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingCoaId(null)
    }
  }

  const handleDeleteCOA = async (coaId: string) => {
    if (!confirm('Delete this COA?')) return

    try {
      const { error } = await supabaseVendor
        .from('vendor_coas')
        .update({ is_active: false })
        .eq('id', coaId)

      if (error) throw error

      setSuccess('COA deleted')
      loadVendorCOAs(selectedVendor)
    } catch (err) {
      console.error('Error deleting COA:', err)
      setError('Delete failed')
    }
  }

  // Check if COA is already uploaded to this vendor
  const isUploaded = (coaMetadata: any) => {
    return vendorCOAs.some(vc => 
      vc.batch_number === coaMetadata.batch_id &&
      (vc.metadata as any)?.sample_id === coaMetadata.sample_id
    )
  }

  // Combined list with status
  const allCOAs = availableCOAs.map(coa => ({
    ...coa,
    isUploaded: isUploaded(coa),
    uploadedData: vendorCOAs.find(vc => 
      vc.batch_number === coa.batch_id &&
      (vc.metadata as any)?.sample_id === coa.sample_id
    )
  }))

  const filteredCOAs = allCOAs.filter(coa => {
    const matchesSearch = !searchQuery || 
      coa.strain_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coa.sample_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coa.batch_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coa.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'uploaded' && coa.isUploaded) ||
      (filterStatus === 'available' && !coa.isUploaded)
    
    return matchesSearch && matchesFilter
  })

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Lobster, cursive' }}>
              Vendor COAs
            </h1>
            <p className="text-neutral-500">
              Manage lab results for marketplace vendors
            </p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-neutral-800/50 backdrop-blur-xl rounded-xl border border-neutral-700/50">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-neutral-300 flex-1 text-sm">{error}</p>
                <button onClick={() => setError('')} className="text-neutral-500 hover:text-neutral-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-neutral-800/50 backdrop-blur-xl rounded-xl border border-neutral-700/50">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-neutral-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-neutral-300 flex-1 text-sm">{success}</p>
                <button onClick={() => setSuccess('')} className="text-neutral-500 hover:text-neutral-300">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {!selectedVendor ? (
            /* Vendor Selection */
            <div>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full max-w-md px-4 py-3 bg-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-all shadow-[0_4px_12px_0_rgba(0,0,0,0.3)]"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vendors.filter(v => 
                    !searchQuery || 
                    v.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    v.email.toLowerCase().includes(searchQuery.toLowerCase())
                  ).map((vendor) => (
                    <button
                      key={vendor.id}
                      onClick={() => setSelectedVendor(vendor.id)}
                      className="group bg-neutral-800/50 backdrop-blur-xl rounded-2xl p-6 border border-neutral-700/50 hover:border-neutral-600 hover:bg-neutral-800/70 transition-all text-left shadow-[0_4px_12px_0_rgba(0,0,0,0.3)]"
                    >
                      <div className="flex items-start gap-4 mb-3">
                        {vendor.logo_url ? (
                          <img 
                            src={vendor.logo_url} 
                            alt={vendor.store_name}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-neutral-700 flex items-center justify-center">
                            <span className="text-xl font-bold text-neutral-400">
                              {vendor.store_name.charAt(0)}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-white mb-1 truncate">
                            {vendor.store_name}
                          </h3>
                          <p className="text-xs text-neutral-500 truncate">{vendor.email}</p>
                        </div>
                      </div>

                      <div className="text-xs text-neutral-600">
                        {vendor.total_locations} {vendor.total_locations === 1 ? 'location' : 'locations'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Selected Vendor View */
            <div className="space-y-6">
              {/* Header Bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedVendor('')}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800/50 backdrop-blur-xl hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all border border-neutral-700/50 shadow-[0_4px_12px_0_rgba(0,0,0,0.3)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm">Back</span>
                </button>

                <button
                  onClick={syncVendorAsClient}
                  disabled={syncing}
                  className="px-4 py-2 bg-neutral-800/50 backdrop-blur-xl hover:bg-neutral-800 border border-neutral-700/50 text-neutral-300 hover:text-white rounded-xl transition-all disabled:opacity-50 text-sm shadow-[0_4px_12px_0_rgba(0,0,0,0.3)]"
                >
                  {syncing ? 'Syncing...' : 'Sync as Client'}
                </button>
              </div>

              {/* Vendor Info */}
              {selectedVendorData && (
                <div className="bg-neutral-800/50 backdrop-blur-xl rounded-2xl p-6 border border-neutral-700/50 shadow-[0_4px_12px_0_rgba(0,0,0,0.3)]">
                  <div className="flex items-center gap-4">
                    {selectedVendorData.logo_url && (
                      <img 
                        src={selectedVendorData.logo_url} 
                        alt={selectedVendorData.store_name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">{selectedVendorData.store_name}</h2>
                      <p className="text-sm text-neutral-500">{selectedVendorData.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search COAs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-3 bg-neutral-800/50 backdrop-blur-xl border border-neutral-700/50 rounded-xl text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-all shadow-[0_4px_12px_0_rgba(0,0,0,0.3)]"
                />
                
                <div className="flex gap-2 bg-neutral-800/50 backdrop-blur-xl p-1 rounded-xl border border-neutral-700/50 shadow-[0_4px_12px_0_rgba(0,0,0,0.3)]">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterStatus === 'all'
                        ? 'bg-white/10 text-white'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterStatus('available')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterStatus === 'available'
                        ? 'bg-white/10 text-white'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Available
                  </button>
                  <button
                    onClick={() => setFilterStatus('uploaded')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filterStatus === 'uploaded'
                        ? 'bg-white/10 text-white'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Uploaded
                  </button>
                </div>
              </div>

              {/* COA List */}
              <div className="bg-neutral-800/50 backdrop-blur-xl rounded-2xl border border-neutral-700/50 overflow-hidden shadow-[0_4px_12px_0_rgba(0,0,0,0.3)]">
                {loading ? (
                  <div className="p-12 flex justify-center">
                    <LoadingSpinner />
                  </div>
                ) : filteredCOAs.length === 0 ? (
                  <div className="p-12 text-center">
                    <svg className="w-16 h-16 text-neutral-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-neutral-500">No COAs found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-700/50">
                    {filteredCOAs.map((coa) => (
                      <div
                        key={coa.id}
                        className="p-4 hover:bg-neutral-800/30 transition-all"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-medium truncate">
                                {coa.strain_name || coa.sample_id || 'N/A'}
                              </h4>
                              {coa.isUploaded && (
                                <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-white/5 text-neutral-500">
                                  Uploaded
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600">
                              <span>{coa.client_name}</span>
                              <span>•</span>
                              <span>{coa.batch_id}</span>
                              {coa.date_tested && (
                                <>
                                  <span>•</span>
                                  <span>{coa.date_tested}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {coa.isUploaded ? (
                              <>
                                <a
                                  href={coa.uploadedData?.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 hover:text-white text-sm font-medium rounded-lg transition-all"
                                >
                                  View
                                </a>
                                <button
                                  onClick={() => handleDeleteCOA(coa.uploadedData.id)}
                                  className="px-4 py-2 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-400 hover:text-white text-sm font-medium rounded-lg transition-all"
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUploadSpecificCOA(coa)}
                                disabled={uploadingCoaId === coa.id}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                              >
                                {uploadingCoaId === coa.id ? (
                                  <span className="flex items-center gap-2">
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Uploading
                                  </span>
                                ) : (
                                  'Upload'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
