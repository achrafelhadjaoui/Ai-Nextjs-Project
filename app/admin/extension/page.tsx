'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Globe, Plus, Trash2, Save, RefreshCw, CheckCircle, XCircle, Settings } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSessionMonitor } from '@/lib/hooks/useSessionMonitor';

interface ExtensionSettings {
  enableOnAllSites: boolean;
  allowedSites: string[];
}

export default function AdminExtensionPage() {
  const [settings, setSettings] = useState<ExtensionSettings>({
    enableOnAllSites: false,
    allowedSites: []
  });
  const [newSite, setNewSite] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useSessionMonitor();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/extension/settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings || {
          enableOnAllSites: false,
          allowedSites: []
        });
      } else {
        toast.error(data.message || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load extension settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSite = () => {
    const site = newSite.trim().toLowerCase();

    if (!site) {
      toast.error('Please enter a website');
      return;
    }

    if (settings.allowedSites.includes(site)) {
      toast.error('Website already added');
      return;
    }

    setSettings(prev => ({
      ...prev,
      allowedSites: [...prev.allowedSites, site]
    }));

    setNewSite('');
    toast.success(`Added ${site}`);
  };

  const handleRemoveSite = (site: string) => {
    setSettings(prev => ({
      ...prev,
      allowedSites: prev.allowedSites.filter(s => s !== site)
    }));
    toast.success(`Removed ${site}`);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/admin/extension/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Settings saved successfully');

        // Auto-sync after save
        await handleSync();
      } else {
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);

      const response = await fetch('/api/admin/extension/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Settings synced! ${data.syncedUsers || 0} extensions updated`);
      } else {
        toast.error(data.message || 'Failed to sync');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Failed to sync with extensions');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-white">Loading extension settings...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-white" />
            <h1 className="text-3xl font-bold text-white">Extension Settings</h1>
          </div>
          <p className="text-gray-400">
            Configure which websites the Farisly AI extension can work on
          </p>
        </div>

        {/* Enable on All Sites Toggle */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Enable on All Websites</h3>
              <p className="text-sm text-gray-400">
                Allow extension to work on all websites (not recommended for production)
              </p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, enableOnAllSites: !prev.enableOnAllSites }))}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                settings.enableOnAllSites ? 'bg-green-500' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  settings.enableOnAllSites ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.enableOnAllSites && (
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Extension will work on ALL websites. This may affect performance on some sites.
              </p>
            </div>
          )}
        </div>

        {/* Allowed Websites */}
        <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Allowed Websites
          </h3>

          <p className="text-sm text-gray-400 mb-4">
            Specify which websites the extension should work on. Users will only see the extension on these sites.
          </p>

          {/* Add New Site */}
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={newSite}
              onChange={(e) => setNewSite(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddSite()}
              placeholder="e.g., fiverr.com, upwork.com, freelancer.com"
              className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700"
            />
            <button
              onClick={handleAddSite}
              className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Site
            </button>
          </div>

          {/* Website List */}
          {settings.allowedSites.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No websites added yet</p>
              <p className="text-sm mt-2">Add websites above to restrict where the extension works</p>
            </div>
          ) : (
            <div className="space-y-2">
              {settings.allowedSites.map((site, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-gray-800 rounded-lg hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">{site}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSite(site)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Common Websites Suggestions */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-sm text-gray-400 mb-3">Quick add popular sites:</p>
            <div className="flex flex-wrap gap-2">
              {['fiverr.com', 'upwork.com', 'freelancer.com', 'gmail.com', 'linkedin.com', 'twitter.com', 'facebook.com'].map(site => (
                !settings.allowedSites.includes(site) && (
                  <button
                    key={site}
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        allowedSites: [...prev.allowedSites, site]
                      }));
                      toast.success(`Added ${site}`);
                    }}
                    className="px-3 py-1.5 bg-white/5 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-white/10 hover:border-gray-600 transition-colors"
                  >
                    + {site}
                  </button>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <button
            onClick={handleSync}
            disabled={syncing || saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync to Extensions'}
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h4 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
            <span className="text-xl">ℹ️</span>
            How it works
          </h4>
          <ul className="text-blue-300 text-sm space-y-2">
            <li>• Add websites where you want the extension to appear</li>
            <li>• Users will only see the Farisly AI icon on these specific sites</li>
            <li>• Click "Save Settings" to update the database</li>
            <li>• Click "Sync to Extensions" to push changes to all active users</li>
            <li>• Changes take effect immediately for users on those websites</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
