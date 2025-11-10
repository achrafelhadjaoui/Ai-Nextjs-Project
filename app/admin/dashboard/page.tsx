// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, BarChart, Settings, Trash2, SquarePen, UserPlus } from 'lucide-react';
import { getUsers, deleteUser } from '@/lib/api/admin';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSessionMonitor } from '@/lib/hooks/useSessionMonitor';
import UserEditModal from '@/components/admin/UserEditModal';
import AddUserModal from '@/components/admin/AddUserModal';
import { SessionProvider } from "next-auth/react";
import { showToast, showConfirm } from '@/components/ui/ToastNotification';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { loading: authLoading } = useAuth();

  // Monitor session for role changes and deletions
  useSessionMonitor();

  // Fetch users data when component mounts
  useEffect(() => {
    if (authLoading) return;
    fetchUsers();
  }, [authLoading]);

  const fetchUsers = async () => {
    try {
      setDataLoading(true);
      setError(null);
      const res = await getUsers();
      
      if (res.success) {
        setUsers(res.data || []);
      } else {
        setError(res.error || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Server error occurred while fetching users');
    } finally {
      setDataLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      'Are you sure you want to delete this user? This action cannot be undone.',
      async () => {
        try {
          const res = await deleteUser(id);
          if (res.success) {
            setUsers(prevUsers => prevUsers.filter(u => u._id !== id));
            showToast.success('User deleted successfully');
          } else {
            showToast.error(res.message || 'Failed to delete user');
          }
        } catch (err) {
          console.error('Error deleting user:', err);
          showToast.error('Server error occurred while deleting user');
        }
      }
    );
  };

  const handleEdit = (userId: string) => {
    setEditingUserId(userId);
    setIsEditModalOpen(true);
  };

  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  const handleUserAdded = () => {
    // Refresh the users list after adding
    fetchUsers();
  };

  const handleUserUpdated = () => {
    // Refresh the users list after update
    fetchUsers();
  };

  // Middleware handles authentication and role checks, so no need for auth guards here
  return (
    <SessionProvider>
    <>
      <DashboardLayout>
        <div className="ml-6 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold farisly-text-gradient mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">
                Manage users, monitor performance, and configure app settings.
              </p>
            </div>
            <button
              onClick={handleAddUser}
              className="farisly-button farisly-glow-hover flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </button>
          </div>

          {/* Dashboard Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="farisly-card farisly-card-hover p-6">
              <Users className="text-[var(--farisly-purple-light)] mb-3 w-8 h-8" />
              <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
              <p className="text-gray-400 text-sm mb-2">Total Users: {users.length}</p>
              <p className="text-gray-400 text-sm">Add, edit, or remove users.</p>
            </div>

            <div className="farisly-card farisly-card-hover p-6">
              <BarChart className="text-[var(--farisly-success)] mb-3 w-8 h-8" />
              <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
              <p className="text-gray-400 text-sm mb-2">System Overview</p>
              <p className="text-gray-400 text-sm">Monitor system activity and stats.</p>
            </div>

            <div className="farisly-card farisly-card-hover p-6">
              <Settings className="text-[var(--farisly-purple)] mb-3 w-8 h-8" />
              <h3 className="text-xl font-semibold text-white mb-2">App Settings</h3>
              <p className="text-gray-400 text-sm mb-2">Configuration</p>
              <p className="text-gray-400 text-sm">Configure global settings.</p>
            </div>
          </div>

          {/* Users Table Section */}
          <div className="farisly-card farisly-card-hover p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Users</h2>
              <div className="text-sm text-gray-400">
                {users.length} user{users.length !== 1 ? 's' : ''} total
              </div>
            </div>

            {dataLoading && (
              <div className="flex justify-center py-8">
                <div className="text-gray-400">Loading users...</div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
                <p className="text-red-400 text-center">{error}</p>
                <button
                  onClick={fetchUsers}
                  className="w-full mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {!dataLoading && !error && users.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No users found.</p>
              </div>
            )}

            {!dataLoading && !error && users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="py-3 px-4 text-left text-gray-400 font-medium">Name</th>
                      <th className="py-3 px-4 text-left text-gray-400 font-medium">Email</th>
                      <th className="py-3 px-4 text-left text-gray-400 font-medium">Role</th>
                      <th className="py-3 px-4 text-left text-gray-400 font-medium">Status</th>
                      <th className="py-3 px-4 text-left text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-white">{user.name}</td>
                        <td className="py-3 px-4 text-gray-300">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-[var(--farisly-error)]/20 text-[var(--farisly-error)] border border-[var(--farisly-error)]/30'
                              : 'bg-[var(--farisly-purple)]/20 text-[var(--farisly-purple-light)] border border-[var(--farisly-purple)]/30'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isVerified
                              ? 'bg-[var(--farisly-success)]/20 text-[var(--farisly-success)] border border-[var(--farisly-success)]/30'
                              : 'bg-[var(--farisly-warning)]/20 text-[var(--farisly-warning)] border border-[var(--farisly-warning)]/30'
                          }`}>
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(user._id)}
                              className="p-2 text-[var(--farisly-purple-light)] hover:text-[var(--farisly-purple)] hover:bg-[var(--farisly-purple)]/10 rounded transition-colors"
                              title="Edit User"
                            >
                              <SquarePen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="p-2 text-[var(--farisly-error)] hover:text-red-300 hover:bg-[var(--farisly-error)]/10 rounded transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onUserAdded={handleUserAdded}
      />

      {/* User Edit Modal */}
      <UserEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUserId(null);
        }}
        userId={editingUserId || ''}
        onUserUpdated={handleUserUpdated}
      />
      </>
  </SessionProvider>
  );
}