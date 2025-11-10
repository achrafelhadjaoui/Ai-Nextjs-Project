'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Save,
  Trash2,
  Check,
  Monitor,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { useSessionMonitor } from '@/lib/hooks/useSessionMonitor';
import { toast } from 'react-toastify';

export default function AdminSettingsPage() {

  // Extension API Key state
  const [extensionApiKey, setExtensionApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [loadingApiKey, setLoadingApiKey] = useState(false);

  useSessionMonitor();

  useEffect(() => {
    fetchExtensionApiKey();
  }, []);

  // Fetch Extension API Key
  const fetchExtensionApiKey = async () => {
    try {
      setLoadingApiKey(true);
      const res = await fetch('/api/admin/extension/api-key');
      const data = await res.json();

      if (data.success) {
        setExtensionApiKey(data.data.apiKey || '');
        setApiKeyConfigured(data.data.isConfigured);
      } else {
        toast.error(data.message || 'Failed to load API key');
      }
    } catch (error) {
      toast.error('Failed to load API key');
    } finally {
      setLoadingApiKey(false);
    }
  };

  // Save Extension API Key
  const handleSaveApiKey = async () => {
    if (!extensionApiKey || extensionApiKey.trim() === '') {
      toast.error('Please enter a valid API key');
      return;
    }

    if (!extensionApiKey.startsWith('sk-')) {
      toast.error('Invalid OpenAI API key format (should start with sk-)');
      return;
    }

    try {
      setSavingApiKey(true);
      const res = await fetch('/api/admin/extension/api-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: extensionApiKey })
      });

      const data = await res.json();

      if (data.success) {
        toast.success('API key saved successfully! All users can now use AI features.');
        setApiKeyConfigured(true);
      } else {
        toast.error(data.message || 'Failed to save API key');
      }
    } catch (error) {
      toast.error('Failed to save API key');
    } finally {
      setSavingApiKey(false);
    }
  };

  // Delete Extension API Key
  const handleDeleteApiKey = async () => {
    if (!confirm('Are you sure you want to remove the API key? This will disable AI features for all users.')) {
      return;
    }

    try {
      setSavingApiKey(true);
      const res = await fetch('/api/admin/extension/api-key', {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        toast.success('API key removed. AI features are now disabled.');
        setExtensionApiKey('');
        setApiKeyConfigured(false);
      } else {
        toast.error(data.message || 'Failed to remove API key');
      }
    } catch (error) {
      toast.error('Failed to remove API key');
    } finally {
      setSavingApiKey(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Monitor className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-white">Extension Settings</h1>
          </div>
          <p className="text-gray-400">
            Configure OpenAI API key for browser extension AI features
          </p>
        </div>

        {/* Extension Settings */}
        <div className="space-y-6">
            {/* API Key Configuration Card */}
            <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Key className="w-6 h-6 text-blue-500" />
                <div>
                  <h3 className="text-lg font-semibold text-white">OpenAI API Key</h3>
                  <p className="text-sm text-gray-400">Centralized API key for all extension users</p>
                </div>
              </div>

              {loadingApiKey ? (
                <div className="text-center py-8 text-gray-400">
                  Loading API key...
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status Badge */}
                  {apiKeyConfigured && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg w-fit">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400 font-medium">API Key Configured</span>
                    </div>
                  )}

                  {/* API Key Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      API Key
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={extensionApiKey}
                          onChange={(e) => setExtensionApiKey(e.target.value)}
                          placeholder="sk-proj-..."
                          className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      This API key will be used by all users for AI features (Grammar Check, Compose, AI Reply)
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveApiKey}
                      disabled={savingApiKey || !extensionApiKey}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save className="w-4 h-4" />
                      {savingApiKey ? 'Saving...' : 'Save API Key'}
                    </button>

                    {apiKeyConfigured && (
                      <button
                        onClick={handleDeleteApiKey}
                        disabled={savingApiKey}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600/10 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/20 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Key
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Benefits Card */}
              <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-white mb-3">Benefits</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Centralized cost control</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>No user configuration needed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Single billing consolidation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Easy key rotation for all users</span>
                  </li>
                </ul>
              </div>

              {/* Security Card */}
              <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-white mb-3">Security</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>API key never sent to clients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Server-side only access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Admin-only configuration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>Reduced attack surface</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
      </div>
    </DashboardLayout>
  );
}
