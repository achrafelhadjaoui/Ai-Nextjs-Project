// components/admin/UserEditModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Save, Loader2, User, Mail, Shield, CheckCircle, XCircle } from 'lucide-react';
import { updateUser, getUser } from '@/lib/api/admin';

interface UserEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onUserUpdated: () => void;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: string;
}

export default function UserEditModal({ isOpen, onClose, userId, onUserUpdated }: UserEditModalProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user data when modal opens
  useEffect(() => {
    if (isOpen && userId) {
      fetchUserData();
    }
  }, [isOpen, userId]);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUser(userId);
      if (res.success) {
        setUserData(res.data);
      } else {
        setError(res.message || 'Failed to fetch user data');
      }
    } catch (err) {
      setError('Error fetching user data');
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string | boolean) => {
    if (userData) {
      setUserData({ ...userData, [field]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updates = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isVerified: userData.isVerified
      };

      const res = await updateUser(userId, updates);
      
      if (res.success) {
        setSuccess('User updated successfully!');
        setTimeout(() => {
          onUserUpdated();
          onClose();
        }, 1000);
      } else {
        setError(res.message || 'Failed to update user');
      }
    } catch (err) {
      setError('Error updating user');
      console.error('Error updating user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setUserData(null);
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111111] border border-gray-800 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Edit User</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
              <p className="text-red-400 text-center">{error}</p>
              <button
                onClick={fetchUserData}
                className="w-full mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : userData ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Success Message */}
              {success && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-sm text-center">{success}</p>
                </div>
              )}

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={userData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={userData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-gray-700 transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Role Field */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={userData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-gray-700 transition-colors appearance-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {/* Verification Status */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Verification Status
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => handleInputChange('isVerified', true)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${
                      userData.isVerified
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-[#0a0a0a] text-gray-400 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('isVerified', false)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${
                      !userData.isVerified
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : 'bg-[#0a0a0a] text-gray-400 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4" />
                    Pending
                  </button>
                </div>
              </div>

              {/* User Info */}
              <div className="pt-4 border-t border-gray-800">
                <div className="text-xs text-gray-500 space-y-1">
                  <div>User ID: {userData._id}</div>
                  <div>Joined: {new Date(userData.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Unable to load user data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}