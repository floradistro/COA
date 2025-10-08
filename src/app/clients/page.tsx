'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Client } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [deletingClients, setDeletingClients] = useState<Set<string>>(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    license_number: ''
  });
  const [submitting, setSubmitting] = useState(false);

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
    
    if (!formData.name || !formData.address || !formData.license_number) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert([{
          name: formData.name,
          address: formData.address,
          license_number: formData.license_number
        }])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Add to local state
      setClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      
      // Reset form
      setFormData({ name: '', address: '', license_number: '' });
      setShowAddForm(false);
      
      alert(`Successfully added client: ${formData.name}`);
    } catch (err) {
      console.error('Error adding client:', err);
      alert(err instanceof Error ? err.message : 'Failed to add client');
    } finally {
      setSubmitting(false);
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
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
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

        {/* Add Client Form */}
        {showAddForm && (
          <div className="mb-8 bg-neutral-800/50 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-neutral-700/50 shadow-xl">
            <h3 className="text-2xl font-bold text-neutral-100 mb-6">Add New Client</h3>
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
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-neutral-300 mb-2">
                  Address *
                </label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g., 4111 E Rose Lake Dr&#10;Charlotte, NC 28217"
                  rows={3}
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="license_number" className="block text-sm font-medium text-neutral-300 mb-2">
                  License Number *
                </label>
                <input
                  type="text"
                  id="license_number"
                  value={formData.license_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                  placeholder="e.g., USDA_37_0979"
                  className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 text-neutral-100 placeholder-neutral-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {submitting ? 'Adding...' : 'Add Client'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
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
                  <h3 className="text-xl font-semibold text-neutral-100 mb-2">
                    {client.name}
                  </h3>
                  <div className="text-sm text-neutral-400 whitespace-pre-line mb-2">
                    {client.address}
                  </div>
                  <div className="text-sm text-neutral-400">
                    <span className="font-medium">License:</span> {client.license_number}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-neutral-700">
                  <button
                    onClick={() => handleDeleteClient(client)}
                    disabled={deletingClients.has(client.id)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm flex items-center justify-center gap-2"
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

