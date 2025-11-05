'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Settings,
  Palette,
  Mail,
  FileText,
  Globe,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  X,
  Monitor,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { useSessionMonitor } from '@/lib/hooks/useSessionMonitor';
import { toast } from 'react-toastify';

type SettingCategory = 'general' | 'theme' | 'email' | 'features' | 'content' | 'seo' | 'extension';

interface Setting {
  _id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'html' | 'array';
  category: SettingCategory;
  label: string;
  description?: string;
  isPublic: boolean;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { id: 'general' as SettingCategory, label: 'General', icon: Settings },
  { id: 'theme' as SettingCategory, label: 'Theme', icon: Palette },
  { id: 'email' as SettingCategory, label: 'Email', icon: Mail },
  { id: 'content' as SettingCategory, label: 'Content', icon: FileText },
  { id: 'seo' as SettingCategory, label: 'SEO', icon: Globe },
  { id: 'extension' as SettingCategory, label: 'Extension', icon: Monitor },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingCategory>('general');
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editedSettings, setEditedSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initializing, setInitializing] = useState(false);

  // Extension API Key state
  const [extensionApiKey, setExtensionApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [savingApiKey, setSavingApiKey] = useState(false);
  const [loadingApiKey, setLoadingApiKey] = useState(false);

  useSessionMonitor();

  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch Extension API key when Extension tab is active
  useEffect(() => {
    if (activeTab === 'extension') {
      fetchExtensionApiKey();
    }
  }, [activeTab]);

  const handleInitialize = async () => {
    if (!confirm('This will initialize default settings. Continue?')) return;

    try {
      setInitializing(true);
      const res = await fetch('/api/admin/settings/init', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message);
        await fetchSettings();
      } else {
        toast.error(data.message || 'Failed to initialize settings');
      }
    } catch (error) {
      console.error('Error initializing settings:', error);
      toast.error('Failed to initialize settings');
    } finally {
      setInitializing(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      const data = await res.json();

      if (data.success) {
        setSettings(data.data);
        // Initialize edited settings with current values
        const initial = data.data.reduce((acc: any, setting: Setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {});
        setEditedSettings(initial);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Error fetching extension API key:', error);
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
      console.error('Error saving API key:', error);
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
      console.error('Error deleting API key:', error);
      toast.error('Failed to remove API key');
    } finally {
      setSavingApiKey(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Only send settings that have been changed
      const changedSettings = settings
        .filter(setting => editedSettings[setting.key] !== setting.value)
        .map(setting => ({
          key: setting.key,
          value: editedSettings[setting.key],
        }));

      if (changedSettings.length === 0) {
        toast.info('No changes to save');
        return;
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: changedSettings }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(`${changedSettings.length} settings updated successfully`);
        await fetchSettings(); // Refresh to get updated data
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

  const handleReset = () => {
    const initial = settings.reduce((acc: any, setting: Setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    setEditedSettings(initial);
    toast.info('Changes discarded');
  };

  const handleChange = (key: string, value: any) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }));
  };

  const filteredSettings = settings.filter(s => s.category === activeTab);
  const hasChanges = JSON.stringify(editedSettings) !== JSON.stringify(
    settings.reduce((acc: any, s: Setting) => {
      acc[s.key] = s.value;
      return acc;
    }, {})
  );

  const renderInput = (setting: Setting) => {
    const value = editedSettings[setting.key];

    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => handleChange(setting.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </div>
            <span className="text-sm text-gray-400">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleChange(setting.key, parseFloat(e.target.value))}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        );

      case 'html':
      case 'json':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
              if (setting.type === 'json') {
                try {
                  handleChange(setting.key, JSON.parse(e.target.value));
                } catch {
                  handleChange(setting.key, e.target.value);
                }
              } else {
                handleChange(setting.key, e.target.value);
              }
            }}
            rows={6}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className="w-full px-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">App Settings</h1>
          <p className="text-gray-400">
            Manage and customize your application settings, theme, and content
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-800">
          <div className="flex gap-4 overflow-x-auto">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === cat.id
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        {hasChanges && (
          <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex items-center justify-between">
            <p className="text-blue-400 text-sm">You have unsaved changes</p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Extension Tab - Custom UI */}
        {activeTab === 'extension' ? (
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
        ) : (
          // Regular Settings List for other tabs
          <>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="text-gray-400">Loading settings...</div>
              </div>
            ) : settings.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-12 text-center">
            <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No settings found in database</p>
            <p className="text-sm text-gray-500 mb-6">Initialize default settings to get started</p>
            <button
              onClick={handleInitialize}
              disabled={initializing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {initializing ? 'Initializing...' : 'Initialize Default Settings'}
            </button>
          </div>
        ) : filteredSettings.length === 0 ? (
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-12 text-center">
            <Settings className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">No settings found for this category</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSettings.map((setting) => (
              <div
                key={setting._id}
                className="bg-[#111111] border border-gray-800 rounded-xl p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">
                        {setting.label}
                      </h3>
                      {setting.isPublic && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          Public
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full font-mono">
                        {setting.key}
                      </span>
                    </div>
                    {setting.description && (
                      <p className="text-sm text-gray-400">{setting.description}</p>
                    )}
                  </div>
                </div>
                <div>{renderInput(setting)}</div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
