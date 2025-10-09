'use client';

import React, { useState, useEffect } from 'react';
import { supabaseData as supabase } from '@/lib/supabaseClient';
import { Client } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function ClientsPageContent() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [deletingClients, setDeletingClients] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    license_number: '',
    email: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<Set<string>>(new Set());

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch clients from Supabase
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      fetchClients();
    }
  }, [mounted]);

  // Handle add client
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Please enter a client name');
      return;
    }

    // Validate email/password if provided
    if (formData.email && !formData.password && !editingClient) {
      alert('Please provide a password for Quantix portal access');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    if (formData.password && !formData.email) {
      alert('Please provide an email address for Quantix portal access');
      return;
    }

    try {
      setSubmitting(true);

      // EDIT MODE
      if (editingClient) {
        // Update existing client
        const { data, error: updateError } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            address: formData.address || null,
            license_number: formData.license_number || null,
            email: formData.email ? formData.email.toLowerCase().trim() : null
          })
          .eq('id', editingClient.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        // If email was added/changed and password provided, create/update auth
        if (formData.email && formData.password && formData.email.toLowerCase().trim() !== editingClient.email?.toLowerCase().trim()) {
          const { error: authError } = await supabase.auth.signUp({
            email: formData.email.toLowerCase().trim(),
            password: formData.password,
            options: {
              emailRedirectTo: 'https://quantixanalytics.com/client-portal',
              data: {
                client_name: formData.name,
              }
            }
          });

          if (authError && !authError.message.includes('already registered')) {
            console.warn('Auth account creation warning:', authError);
          }
        }

        // Update local state
        setClients(prev => prev.map(c => c.id === editingClient.id ? data : c).sort((a, b) => a.name.localeCompare(b.name)));
        
        setFormData({ name: '', address: '', license_number: '', email: '', password: '' });
        setEditingClient(null);
        setShowAddForm(false);
        
        alert(`✅ Successfully updated client "${formData.name}"`);
      } 
      // ADD MODE
      else {
        let wasAuthAccountReused = false;
        
        // Create Supabase auth account if email/password provided
        if (formData.email && formData.password) {
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email.toLowerCase().trim(),
            password: formData.password,
            options: {
              emailRedirectTo: 'https://quantixanalytics.com/client-portal',
              data: {
                client_name: formData.name,
              }
            }
          });

          // If user already exists, try to resend verification email
          if (authError && authError.message.includes('already registered')) {
            console.log('Auth account already exists, attempting to resend verification...');
            wasAuthAccountReused = true;
            
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email: formData.email.toLowerCase().trim(),
              options: {
                emailRedirectTo: 'https://quantixanalytics.com/client-portal'
              }
            });
            
            if (resendError) {
              console.warn('Could not resend verification:', resendError);
              // Don't fail the client creation if resend fails
            } else {
              console.log('✅ Verification email resent to:', formData.email);
            }
          } else if (authError) {
            throw new Error(`Failed to create Quantix portal account: ${authError.message}`);
          } else if (authData.user) {
            console.log('✅ Created Quantix portal account for:', authData.user.email);
          }
        }

        // Insert client record
        const { data, error: insertError } = await supabase
          .from('clients')
          .insert([{
            name: formData.name,
            address: formData.address || null,
            license_number: formData.license_number || null,
            email: formData.email ? formData.email.toLowerCase().trim() : null
          }])
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        // Add to local state
        setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
        
        // Reset form
        setFormData({ name: '', address: '', license_number: '', email: '', password: '' });
        setShowAddForm(false);
        
        // Determine the appropriate success message
        let message = `✅ Successfully added client "${formData.name}"`;
        if (formData.email) {
          if (wasAuthAccountReused) {
            message += `\n✅ Verification email resent to ${formData.email}`;
          } else {
            message += `\n✅ Quantix portal account created for ${formData.email}`;
          }
          message += `\n\nClient can login at www.quantixanalytics.com/client-portal after verifying their email`;
        }
        alert(message);
      }
    } catch (err) {
      console.error('Error adding client:', err);
      
      // Extract detailed error message
      let errorMessage = 'Failed to add client';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String((err as { message: unknown }).message);
      } else if (err && typeof err === 'object' && 'error' in err) {
        errorMessage = String((err as { error: unknown }).error);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      address: client.address || '',
      license_number: client.license_number || '',
      email: client.email || '',
      password: ''
    });
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingClient(null);
    setFormData({ name: '', address: '', license_number: '', email: '', password: '' });
    setShowAddForm(false);
  };

  // Handle resend verification email
  const handleResendVerification = async (client: Client) => {
    if (!client.email) {
      alert('No email address associated with this client');
      return;
    }

    try {
      setResendingEmail(prev => new Set([...prev, client.id]));

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: client.email.toLowerCase().trim(),
        options: {
          emailRedirectTo: 'https://quantixanalytics.com/client-portal'
        }
      });

      if (error) {
        throw error;
      }

      alert(`✅ Verification email sent to ${client.email}\n\nPlease check the inbox (and spam folder) for the verification link.`);
    } catch (err) {
      console.error('Error resending verification:', err);
      alert(err instanceof Error ? err.message : 'Failed to resend verification email');
    } finally {
      setResendingEmail(prev => {
        const newSet = new Set(prev);
        newSet.delete(client.id);
        return newSet;
      });
    }
  };

  // Handle delete client
  const handleDeleteClient = async (client: Client) => {
    if (typeof window === 'undefined') return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${client.name}"?\n\nThis will NOT delete existing COAs for this client, but you won't be able to generate new COAs for them unless you re-add them.`
    );

    if (!confirmed) return;

    try {
      setDeletingClients(prev => new Set([...prev, client.id]));

      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (deleteError) {
        throw deleteError;
      }

      // Remove from local state
      setClients(prev => prev.filter(c => c.id !== client.id));
      
      alert(`Successfully deleted client: ${client.name}`);
    } catch (err) {
      console.error('Error deleting client:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete client');
    } finally {
      setDeletingClients(prev => {
        const newSet = new Set(prev);
        newSet.delete(client.id);
        return newSet;
      });
    }
  };

  // Render loading state on server and initial client render
  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-10 bg-neutral-700 rounded w-1/4 mb-4"></div>
            <div className="h-6 bg-neutral-700 rounded w-3/4 mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-neutral-700/50 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Link href="/" className="text-neutral-400 hover:text-neutral-200 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <h1 className="text-4xl font-bold text-neutral-100" style={{ fontFamily: 'Lobster, cursive' }}>
                  WhaleTools
                </h1>
                <span className="text-2xl text-neutral-500">•</span>
                <h2 className="text-3xl font-bold text-neutral-100">Client Management</h2>
              </div>
              <p className="text-lg text-neutral-300">
                Manage client information for COA generation. Add or remove clients as needed.
              </p>
            </div>
            <button
              onClick={() => {
                if (showAddForm) {
                  handleCancelEdit();
                } else {
                  setShowAddForm(true);
                }
              }}
              className="px-6 py-3 bg-neutral-200 text-neutral-900 rounded-lg hover:bg-white transition-colors font-medium"
            >
              {showAddForm ? 'Cancel' : '+ Add Client'}
            </button>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-900/50 text-red-200 rounded-lg whitespace-pre-line border border-red-700/50">
              {error}
            </div>
          )}
        </div>

        {/* Add/Edit Client Form */}
        {showAddForm && (
          <div className="mb-8 bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-neutral-700/50 shadow-xl">
            <h3 className="text-2xl font-bold text-neutral-100 mb-6">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h3>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-300 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Flora Distribution Group LLC"
                  className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-neutral-300 mb-2">
                  Address
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g., 4111 E Rose Lake Dr&#10;Charlotte, NC 28217"
                  rows={3}
                  className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
                />
              </div>
              
              <div>
                <label htmlFor="license_number" className="block text-sm font-medium text-neutral-300 mb-2">
                  License Number
                </label>
                <input
                  type="text"
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  placeholder="e.g., USDA_37_0979"
                  className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
                />
              </div>

              {/* Quantix Portal Access Section */}
              <div className="border-t border-neutral-700 pt-6 mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-neutral-700 rounded-lg">
                    <svg className="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-neutral-200">Quantix Portal Access</h4>
                    <p className="text-xs text-neutral-400">Give client access to view their COAs online</p>
                  </div>
                </div>
                
                <div className="space-y-4 bg-neutral-800/30 p-4 rounded-lg border border-neutral-700">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="client@company.com"
                      className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Client will use this to login at quantixanalytics.com</p>
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-2">
                      Password {editingClient && '(leave blank to keep current)'}
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={editingClient ? "Leave blank to keep current password" : "Minimum 6 characters"}
                      className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:ring-1 focus:ring-neutral-500 focus:border-neutral-500"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      {editingClient ? 'Only enter if changing password' : 'Create a secure password for the client'}
                    </p>
                  </div>

                  <div className="bg-neutral-900/50 border border-neutral-700 rounded-lg p-3">
                    <div className="flex gap-2">
                      <svg className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-xs text-neutral-400">
                        {editingClient 
                          ? 'Update email/password to modify portal access'
                          : 'Leave blank to skip portal access. You can add it later by editing the client.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-neutral-200 text-neutral-900 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitting ? (editingClient ? 'Saving...' : 'Adding...') : (editingClient ? 'Save Changes' : 'Add Client')}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-6 py-2 bg-neutral-700 text-neutral-100 rounded-lg hover:bg-neutral-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* No Clients State */}
        {!loading && !error && clients.length === 0 && (
          <div className="bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-2xl shadow-xl p-12 text-center">
            <h3 className="text-lg font-medium text-neutral-100 mb-2">
              No clients added yet
            </h3>
            <p className="text-neutral-400">
              Click &quot;Add Client&quot; to create your first client
            </p>
          </div>
        )}

        {/* Clients List */}
        {!loading && !error && clients.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-neutral-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-neutral-700/50 p-6"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-neutral-100">
                      {client.name}
                    </h3>
                    {client.email && (
                      <span className="text-xs bg-neutral-700 text-neutral-300 px-2 py-1 rounded border border-neutral-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Portal
                      </span>
                    )}
                  </div>
                  {client.address && (
                    <div className="text-sm text-neutral-400 whitespace-pre-line mb-2">
                      {client.address}
                    </div>
                  )}
                  {client.license_number && (
                    <div className="text-sm text-neutral-400 mb-1">
                      <span className="font-medium">License:</span> {client.license_number}
                    </div>
                  )}
                  {client.email && (
                    <div className="text-sm text-neutral-400">
                      <span className="font-medium">Email:</span> {client.email}
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-neutral-700 space-y-2">
                  <button
                    onClick={() => handleEditClient(client)}
                    className="w-full px-4 py-2 bg-neutral-700 text-neutral-100 rounded-lg hover:bg-neutral-600 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Client
                  </button>
                  
                  {client.email && (
                    <button
                      onClick={() => handleResendVerification(client)}
                      disabled={resendingEmail.has(client.id)}
                      className="w-full px-4 py-2 bg-blue-900/30 text-blue-300 rounded-lg hover:bg-blue-900/50 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2 border border-blue-800"
                    >
                      {resendingEmail.has(client.id) ? (
                        <>
                          <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Resend Verification Email
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteClient(client)}
                    disabled={deletingClients.has(client.id)}
                    className="w-full px-4 py-2 bg-neutral-800 text-neutral-400 rounded-lg hover:bg-neutral-900 hover:text-red-400 hover:border-red-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2 border border-neutral-700"
                  >
                    {deletingClients.has(client.id) ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Client
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {!loading && !error && clients.length > 0 && (
          <div className="mt-8 bg-neutral-800/50 backdrop-blur-sm border border-neutral-700/50 rounded-lg shadow-xl p-6">
            <div className="text-sm text-neutral-400">
              Total Clients: <span className="text-neutral-200 font-medium">{clients.length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  return (
    <ProtectedRoute>
      <ClientsPageContent />
    </ProtectedRoute>
  )
}
