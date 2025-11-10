"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/lib/hooks/useAuth";
import { useSettings } from "@/providers/settings-provider";
import { toast } from "react-toastify";
import {
  User,
  Mail,
  Calendar,
  Edit,
  Save,
  X,
  Loader2,
  MapPin,
  Building,
  Globe,
  Phone,
  Clock,
  Languages,
  Bell,
  Camera,
  Trash2,
  Lock,
  AlertTriangle,
  Monitor,
  Plus,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  image?: string;
  bio?: string;
  phone?: string;
  location?: string;
  company?: string;
  website?: string;
  timezone?: string;
  language?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  extensionSettings?: {
    enableOnAllSites: boolean;
    allowedSites: string[];
  };
  createdAt: string;
  updatedAt?: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { get } = useSettings();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    phone: "",
    location: "",
    company: "",
    website: "",
    timezone: "",
    language: "",
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
  });

  // Extension settings state
  const [extensionSettings, setExtensionSettings] = useState({
    enableOnAllSites: true,
    allowedSites: [] as string[],
  });
  const [newSiteKeyword, setNewSiteKeyword] = useState("");

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteData, setDeleteData] = useState({
    password: "",
    confirmDelete: false,
  });
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/profile");
      const data = await res.json();

      if (data.success) {
        setProfile(data.data);
        setFormData({
          name: data.data.name || "",
          bio: data.data.bio || "",
          phone: data.data.phone || "",
          location: data.data.location || "",
          company: data.data.company || "",
          website: data.data.website || "",
          timezone: data.data.timezone || "UTC",
          language: data.data.language || "en",
        });
        setNotifications(
          data.data.notifications || {
            email: true,
            push: true,
            sms: false,
          }
        );
        setExtensionSettings(
          data.data.extensionSettings || {
            enableOnAllSites: true,
            allowedSites: [],
          }
        );
      } else {
        toast.error(data.message || "Failed to load profile");
      }
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        // Update profile with new image
        const updateRes = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: data.data.url }),
        });

        const updateData = await updateRes.json();

        if (updateData.success) {
          setProfile(updateData.data);
          toast.success("Profile photo updated!");
        } else {
          toast.error(updateData.message || "Failed to update photo");
        }
      } else {
        toast.error(data.message || "Failed to upload image");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          notifications,
          extensionSettings,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setProfile(data.data);
        setIsEditing(false);
        toast.success("Profile updated successfully!");

        // Trigger immediate config sync in extension
        try {
          if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime) {
            // Try to sync - if service worker is inactive, this will wake it up
            let syncSuccessful = false;
            const attemptSync = (retryCount = 0) => {
              (window as any).chrome.runtime.sendMessage({ type: 'SYNC_EXTENSION_CONFIG' }, (response: any) => {
                if ((window as any).chrome.runtime.lastError) {
                  const error = (window as any).chrome.runtime.lastError.message;

                  // Retry up to 2 times with increasing delays
                  if (retryCount < 2) {
                    const delay = retryCount === 0 ? 500 : 1000;
                    setTimeout(() => attemptSync(retryCount + 1), delay);
                  } else {
                    // All retries failed, but SSE will sync within 2 seconds
                    toast.info('Extension will sync automatically within 2 seconds (real-time)');
                  }
                } else if (response && response.success) {
                  if (!syncSuccessful) {
                    syncSuccessful = true;
                    toast.success('Extension settings synced immediately!');
                  }
                } else {
                  toast.info('Extension will sync automatically within 2 seconds (real-time)');
                }
              });
            };
            attemptSync();
          } else {
            // Extension not installed
            toast.info('Settings saved. Install the browser extension to use them.');
          }
        } catch (err) {
          toast.info('Settings saved. Install the browser extension to use them.');
        }
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error("All fields are required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Password changed successfully!");
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(data.message || "Failed to change password");
      }
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteData.confirmDelete) {
      toast.error("Please confirm account deletion");
      return;
    }

    setDeletingAccount(true);

    try {
      const res = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleteData),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Account deleted successfully. Logging out...");
        setTimeout(() => {
          signOut({ callbackUrl: "/" });
        }, 2000);
      } else {
        toast.error(data.message || "Failed to delete account");
      }
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <p className="text-gray-400">Failed to load profile</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl font-bold farisly-text-gradient mb-2">
            {get("content.profile_title", "My Profile")}
          </h1>
          <p className="text-gray-400">
            {get("content.profile_subtitle", "Manage your account settings and preferences")}
          </p>
        </div>

        {/* Profile Card */}
        <div className="farisly-card farisly-card-hover p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 farisly-gradient rounded-full flex items-center justify-center overflow-hidden farisly-glow">
                {profile.image ? (
                  <img
                    src={profile.image}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2 farisly-gradient hover:bg-[var(--farisly-purple-light)] rounded-full cursor-pointer transition-colors farisly-glow-hover">
                <Camera className="w-4 h-4 text-white" />
                <input
                  type="file"
                  onChange={handleImageUpload}
                  className="hidden"
                  accept="image/*"
                  disabled={uploadingImage}
                />
              </label>
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{profile.name}</h2>
                  <p className="text-gray-400 text-sm capitalize">{profile.role} Account</p>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="farisly-button farisly-glow-hover inline-flex items-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        fetchProfile(); // Reset form
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                      disabled={isSaving}
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="farisly-button farisly-glow-hover inline-flex items-center gap-2 text-sm disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
                {profile.location && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.company && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Building className="w-4 h-4" />
                    <span>{profile.company}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="farisly-card farisly-card-hover p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-6">Personal Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="farisly-input disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="w-full px-4 py-2.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                rows={3}
                maxLength={500}
                placeholder="Tell us about yourself..."
                className="farisly-input resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+1 (555) 000-0000"
                  className="farisly-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing}
                  placeholder="City, Country"
                  className="farisly-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Company
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  disabled={!isEditing}
                  placeholder="Your company name"
                  className="farisly-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  disabled={!isEditing}
                  placeholder="https://example.com"
                  className="farisly-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  disabled={!isEditing}
                  className="farisly-input disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Australia/Sydney">Sydney (AEDT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Language
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  disabled={!isEditing}
                  className="farisly-input disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ar">Arabic</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="farisly-card farisly-card-hover p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-sm text-gray-400">Receive updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={(e) =>
                    setNotifications({ ...notifications, email: e.target.checked })
                  }
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--farisly-purple)]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-white font-medium">Push Notifications</p>
                <p className="text-sm text-gray-400">Receive push notifications in browser</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })}
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--farisly-purple)]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-white font-medium">SMS Notifications</p>
                <p className="text-sm text-gray-400">Receive text messages (coming soon)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer opacity-50">
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })}
                  disabled={true}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--farisly-purple)]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Extension Settings */}
        <div className="farisly-card farisly-card-hover p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Extension Settings
          </h3>
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 transition-colors ${
              extensionSettings.enableOnAllSites
                ? 'bg-[#0a0a0a] border-transparent'
                : 'bg-[var(--farisly-purple)]/5 border-[var(--farisly-purple)]/20'
            }`}>
              <div>
                <p className="text-white font-medium">Enable on All Websites</p>
                <p className="text-sm text-gray-400">
                  {extensionSettings.enableOnAllSites
                    ? 'Extension will work on every website you visit'
                    : 'Extension will only work on specific websites you allow'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={extensionSettings.enableOnAllSites}
                  onChange={(e) =>
                    setExtensionSettings({ ...extensionSettings, enableOnAllSites: e.target.checked })
                  }
                  disabled={!isEditing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--farisly-purple)]"></div>
              </label>
            </div>

            {!extensionSettings.enableOnAllSites && (
              <div className="p-4 bg-[#0a0a0a] rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white font-medium">Allowed Websites</p>
                  {extensionSettings.allowedSites.length > 0 && (
                    <span className="text-xs px-2 py-1 bg-[var(--farisly-purple)]/20 text-[var(--farisly-purple-light)] rounded-full">
                      {extensionSettings.allowedSites.length} {extensionSettings.allowedSites.length === 1 ? 'site' : 'sites'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Add keywords or domain names where you want the extension to work
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSiteKeyword}
                    onChange={(e) => setNewSiteKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSiteKeyword.trim()) {
                        if (!extensionSettings.allowedSites.includes(newSiteKeyword.trim())) {
                          setExtensionSettings({
                            ...extensionSettings,
                            allowedSites: [...extensionSettings.allowedSites, newSiteKeyword.trim()],
                          });
                        }
                        setNewSiteKeyword("");
                      }
                    }}
                    placeholder="Type keyword and press Enter..."
                    disabled={!isEditing}
                    className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--farisly-purple)] disabled:opacity-50"
                  />
                  <button
                    onClick={() => {
                      if (newSiteKeyword.trim() && !extensionSettings.allowedSites.includes(newSiteKeyword.trim())) {
                        setExtensionSettings({
                          ...extensionSettings,
                          allowedSites: [...extensionSettings.allowedSites, newSiteKeyword.trim()],
                        });
                        setNewSiteKeyword("");
                      }
                    }}
                    disabled={!isEditing || !newSiteKeyword.trim()}
                    className="px-4 py-2 farisly-gradient hover:bg-[var(--farisly-purple-light)] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {extensionSettings.allowedSites.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {extensionSettings.allowedSites.map((site, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--farisly-purple)]/20 text-[var(--farisly-purple-light)] rounded-full text-sm"
                      >
                        {site}
                        {isEditing && (
                          <button
                            onClick={() => {
                              setExtensionSettings({
                                ...extensionSettings,
                                allowedSites: extensionSettings.allowedSites.filter((_, i) => i !== index),
                              });
                            }}
                            className="hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}

                {extensionSettings.allowedSites.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-3">
                      No websites added yet. The extension won't work on any site until you add keywords.
                    </p>
                    {isEditing && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        <p className="text-xs text-gray-600 w-full mb-1">Quick add:</p>
                        {['fiverr.com', 'upwork.com', 'freelancer.com', 'linkedin.com'].map((site) => (
                          <button
                            key={site}
                            onClick={() => {
                              setExtensionSettings({
                                ...extensionSettings,
                                allowedSites: [...extensionSettings.allowedSites, site],
                              });
                            }}
                            className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition-colors"
                          >
                            + {site}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 p-3 bg-[var(--farisly-purple)]/10 border border-[var(--farisly-purple)]/20 rounded-lg">
                  <p className="text-sm text-[var(--farisly-purple-light)]">
                    <strong>Tip:</strong> Use general keywords like "fiverr" to match all Fiverr pages, or specific domains like "fiverr.com"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security */}
        <div className="farisly-card farisly-card-hover p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Security
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-white font-medium">Password</p>
                <p className="text-sm text-gray-400">
                  {profile.password ? "Change your password" : "OAuth login - No password set"}
                </p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                disabled={!profile.password}
                className="farisly-button farisly-glow-hover text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        {profile.role !== "admin" && (
          <div className="farisly-card border-red-900/30 p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        )}

        {/* Password Change Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-4">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="farisly-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="farisly-input"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="farisly-input"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    disabled={changingPassword}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="farisly-button farisly-glow-hover flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0a0a0a] rounded-lg border border-red-900/30 p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                Delete Account
              </h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-300">
                  <strong>Warning:</strong> This action is permanent and cannot be undone. All your
                  data will be deleted.
                </p>
              </div>
              <div className="space-y-4">
                {profile.password && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Confirm your password
                    </label>
                    <input
                      type="password"
                      value={deleteData.password}
                      onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })}
                      className="farisly-input focus:border-red-500"
                      required={!!profile.password}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="confirmDelete"
                    checked={deleteData.confirmDelete}
                    onChange={(e) =>
                      setDeleteData({ ...deleteData, confirmDelete: e.target.checked })
                    }
                    className="w-4 h-4 bg-[#111111] border border-gray-800 rounded"
                  />
                  <label htmlFor="confirmDelete" className="text-sm text-gray-400">
                    I understand this action is permanent
                  </label>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    disabled={deletingAccount}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount || !deleteData.confirmDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {deletingAccount ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
