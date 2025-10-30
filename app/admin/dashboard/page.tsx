

// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import DashboardLayout from '@/components/DashboardLayout';
// import { Users, BarChart, Settings, Trash2, SquarePen } from 'lucide-react';
// import { getUsers, deleteUser } from '@/lib/api/admin';
// import { verifyToken } from '@/utils/jwt';

// export default function AdminDashboardPage() {
//   const [users, setUsers] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     const checkAdminAccess = () => {
//       const token = document.cookie
//         .split('; ')
//         .find(row => row.startsWith('token='))
//         ?.split('=')[1];

//       if (!token) {
//         router.push('/auth/login');
//         return false;
//       }

//       const decoded = verifyToken(token) as any;
//       if (decoded?.role !== 'admin') {
//         router.push('/dashboard');
//         return false;
//       }

//       return true;
//     };

//     if (!checkAdminAccess()) {
//       return;
//     }

//     const fetchUsers = async () => {
//       try {
//         setLoading(true);
//         const res = await getUsers();
//         if (res.success) {
//           setLoading(false);
//           setUsers(res.data);
//         } else {
//           setError(res.error || 'Failed to fetch users');
//         }
//       } catch (err) {
//         console.error(err);
//         setError('Server error');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, [router]);

//   const handleDelete = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this user?')) return;

//     try {
//       const res = await deleteUser(id);
//       if (res.success) {
//         setUsers(users.filter(u => u._id !== id));
//       } else {
//         alert(res.message || 'Failed to delete user');
//       }
//     } catch (err) {
//       console.error(err);
//       alert('Server error');
//     }
//   };

//   return (
//     <DashboardLayout>
//       <div className="ml-6 p-8">
//         <h1 className="text-3xl font-bold text-white mb-4">Admin Dashboard</h1>
//         <p className="text-gray-400 mb-8">
//           Manage users, monitor performance, and configure app settings.
//         </p>

//         {/* Dashboard Widgets */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <div className="bg-[#111111] p-6 rounded-xl border border-gray-800">
//             <Users className="text-white mb-3" />
//             <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
//             <p className="text-gray-400 text-sm mb-4">Add, edit, or remove users.</p>
//           </div>

//           <div className="bg-[#111111] p-6 rounded-xl border border-gray-800">
//             <BarChart className="text-white mb-3" />
//             <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
//             <p className="text-gray-400 text-sm mb-4">Monitor system activity and stats.</p>
//           </div>

//           <div className="bg-[#111111] p-6 rounded-xl border border-gray-800">
//             <Settings className="text-white mb-3" />
//             <h3 className="text-xl font-semibold text-white mb-2">App Settings</h3>
//             <p className="text-gray-400 text-sm mb-4">Configure global settings.</p>
//           </div>
//         </div>

//         {/* Users Table */}
//         <h2 className="text-2xl font-bold text-white mb-4">Users</h2>

//         {loading && <p className="text-gray-400">Loading users...</p>}
//         {error && <p className="text-red-500 mb-4">{error}</p>}

//         {!loading && !error && (
//           <table className="min-w-full border border-gray-800 rounded-lg text-gray-300">
//             <thead className="bg-[#111111]">
//               <tr>
//                 <th className="py-3 px-4 text-left">Name</th>
//                 <th className="py-3 px-4 text-left">Email</th>
//                 <th className="py-3 px-4 text-left">Role</th>
//                 <th className="py-3 px-4 text-left">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {users.map(u => (
//                 <tr key={u._id} className="border-t border-gray-800">
//                   <td className="py-3 px-4">{u.name}</td>
//                   <td className="py-3 px-4">{u.email}</td>
//                   <td className="py-3 px-4">{u.role}</td>
//                   <td className="py-3 px-4">
//                     <div className="flex justify-between">
//                     <Trash2
//                       className="text-red-400 hover:text-red-500"
//                       onClick={() => handleDelete(u._id)}
//                     />
//                       <SquarePen
//                         className="text-blue-400 hover:text-blue-500"
//                       />
//                       </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }







// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import DashboardLayout from '@/components/DashboardLayout';
// import { Users, BarChart, Settings, Trash2, SquarePen, UserPlus } from 'lucide-react';
// import { getUsers, deleteUser } from '@/lib/api/admin';
// import { useAuth } from '@/lib/hooks/useAuth';

// export default function AdminDashboardPage() {
//   const [users, setUsers] = useState<any[]>([]);
//   const [dataLoading, setDataLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const router = useRouter();
//   const { user, loading: authLoading, isAdmin } = useAuth();

//   // Handle authentication and redirects
//   useEffect(() => {
//     if (authLoading) return; // Still checking auth

//     if (!user) {
//       // No user found, redirect to login
//       router.push('/auth/login');
//       return;
//     }

//     if (!isAdmin) {
//       // User is not admin, redirect to regular dashboard
//       router.push('/dashboard');
//       return;
//     }
//   }, [user, isAdmin, authLoading, router]);

//   // Fetch users data only when confirmed as admin
//   useEffect(() => {
//     if (!isAdmin || authLoading) return;

//     const fetchUsers = async () => {
//       try {
//         setDataLoading(true);
//         setError(null);
//         const res = await getUsers();
        
//         if (res.success) {
//           setUsers(res.data || []);
//         } else {
//           setError(res.error || 'Failed to fetch users');
//         }
//       } catch (err) {
//         console.error('Error fetching users:', err);
//         setError('Server error occurred while fetching users');
//       } finally {
//         setDataLoading(false);
//       }
//     };

//     fetchUsers();
//   }, [isAdmin, authLoading]);

//   const handleDelete = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
//       return;
//     }

//     try {
//       const res = await deleteUser(id);
//       if (res.success) {
//         setUsers(prevUsers => prevUsers.filter(u => u._id !== id));
//       } else {
//         alert(res.message || 'Failed to delete user');
//       }
//     } catch (err) {
//       console.error('Error deleting user:', err);
//       alert('Server error occurred while deleting user');
//     }
//   };

//   const handleEdit = (userId: string) => {
//     // Navigate to edit user page
//     console.log('Edit user:', userId);
//     // router.push(`/dashboard/admin/users/${userId}/edit`);
//   };

//   const handleAddUser = () => {
//     // Navigate to add user page
//     console.log('Add new user');
//     // router.push('/dashboard/admin/users/new');
//   };

//   // Show loading while checking authentication
//   if (authLoading) {
//     return (
//       <DashboardLayout>
//         <div className="ml-6 p-8 flex items-center justify-center min-h-screen">
//           <div className="text-white">Loading...</div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   // Don't render content if not admin (will redirect in useEffect)
//   if (!isAdmin) {
//     return (
//       <DashboardLayout>
//         <div className="ml-6 p-8 flex items-center justify-center min-h-screen">
//           <div className="text-white">Redirecting...</div>
//         </div>
//       </DashboardLayout>
//     );
//   }

//   return (
//     <DashboardLayout>
//       <div className="ml-6 p-8">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
//             <p className="text-gray-400">
//               Manage users, monitor performance, and configure app settings.
//             </p>
//           </div>
//           <button
//             onClick={handleAddUser}
//             className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//           >
//             <UserPlus className="w-5 h-5" />
//             Add User
//           </button>
//         </div>

//         {/* Dashboard Widgets */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//           <div className="bg-[#111111] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
//             <Users className="text-blue-400 mb-3 w-8 h-8" />
//             <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
//             <p className="text-gray-400 text-sm mb-2">Total Users: {users.length}</p>
//             <p className="text-gray-400 text-sm">Add, edit, or remove users.</p>
//           </div>

//           <div className="bg-[#111111] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
//             <BarChart className="text-green-400 mb-3 w-8 h-8" />
//             <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
//             <p className="text-gray-400 text-sm mb-2">System Overview</p>
//             <p className="text-gray-400 text-sm">Monitor system activity and stats.</p>
//           </div>

//           <div className="bg-[#111111] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
//             <Settings className="text-purple-400 mb-3 w-8 h-8" />
//             <h3 className="text-xl font-semibold text-white mb-2">App Settings</h3>
//             <p className="text-gray-400 text-sm mb-2">Configuration</p>
//             <p className="text-gray-400 text-sm">Configure global settings.</p>
//           </div>
//         </div>

//         {/* Users Table Section */}
//         <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-2xl font-bold text-white">Users</h2>
//             <div className="text-sm text-gray-400">
//               {users.length} user{users.length !== 1 ? 's' : ''} total
//             </div>
//           </div>

//           {dataLoading && (
//             <div className="flex justify-center py-8">
//               <div className="text-gray-400">Loading users...</div>
//             </div>
//           )}

//           {error && (
//             <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
//               <p className="text-red-400 text-center">{error}</p>
//             </div>
//           )}

//           {!dataLoading && !error && users.length === 0 && (
//             <div className="text-center py-8">
//               <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
//               <p className="text-gray-400">No users found.</p>
//             </div>
//           )}

//           {!dataLoading && !error && users.length > 0 && (
//             <div className="overflow-x-auto">
//               <table className="w-full border-collapse">
//                 <thead>
//                   <tr className="border-b border-gray-800">
//                     <th className="py-3 px-4 text-left text-gray-400 font-medium">Name</th>
//                     <th className="py-3 px-4 text-left text-gray-400 font-medium">Email</th>
//                     <th className="py-3 px-4 text-left text-gray-400 font-medium">Role</th>
//                     <th className="py-3 px-4 text-left text-gray-400 font-medium">Status</th>
//                     <th className="py-3 px-4 text-left text-gray-400 font-medium">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {users.map((user) => (
//                     <tr key={user._id} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
//                       <td className="py-3 px-4 text-white">{user.name}</td>
//                       <td className="py-3 px-4 text-gray-300">{user.email}</td>
//                       <td className="py-3 px-4">
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           user.role === 'admin' 
//                             ? 'bg-red-500/20 text-red-400 border border-red-500/30'
//                             : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
//                         }`}>
//                           {user.role}
//                         </span>
//                       </td>
//                       <td className="py-3 px-4">
//                         <span className={`px-2 py-1 rounded-full text-xs font-medium ${
//                           user.isVerified
//                             ? 'bg-green-500/20 text-green-400 border border-green-500/30'
//                             : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
//                         }`}>
//                           {user.isVerified ? 'Verified' : 'Pending'}
//                         </span>
//                       </td>
//                       <td className="py-3 px-4">
//                         <div className="flex gap-2">
//                           <button
//                             onClick={() => handleEdit(user._id)}
//                             className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
//                             title="Edit User"
//                           >
//                             <SquarePen className="w-4 h-4" />
//                           </button>
//                           <button
//                             onClick={() => handleDelete(user._id)}
//                             className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
//                             title="Delete User"
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </DashboardLayout>
//   );
// }






// app/admin/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, BarChart, Settings, Trash2, SquarePen, UserPlus } from 'lucide-react';
import { getUsers, deleteUser } from '@/lib/api/admin';
import { useAuth } from '@/lib/hooks/useAuth';
import UserEditModal from '@/components/admin/UserEditModal';

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();

  // Handle authentication and redirects
  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/auth/login');
      return;
    }


    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [user, isAdmin, authLoading, router]);

  // Fetch users data only when confirmed as admin
  useEffect(() => {
    if (!isAdmin || authLoading) return;

    fetchUsers();
  }, [isAdmin, authLoading]);

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
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await deleteUser(id);
      if (res.success) {
        setUsers(prevUsers => prevUsers.filter(u => u._id !== id));
      } else {
        alert(res.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Server error occurred while deleting user');
    }
  };

  const handleEdit = (userId: string) => {
    setEditingUserId(userId);
    setIsEditModalOpen(true);
  };

  const handleAddUser = () => {
    // Navigate to add user page
    console.log('Add new user');
    // router.push('/dashboard/admin/users/new');
  };

  const handleUserUpdated = () => {
    // Refresh the users list after update
    fetchUsers();
  };

  console.log("[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[[", isAdmin)
  // Show loading while checking authentication
  if (authLoading) {
    
    return (
      <DashboardLayout>
        <div className="ml-6 p-8 flex items-center justify-center min-h-screen">
          <div className="text-white">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Don't render content if not admin (will redirect in useEffect)
  if (!isAdmin) {
   
    return (
      <DashboardLayout>
        <div className="ml-6 p-8 flex items-center justify-center min-h-screen">
          <div className="text-white">Redirecting...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout>
        <div className="ml-6 p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">
                Manage users, monitor performance, and configure app settings.
              </p>
            </div>
            <button
              onClick={handleAddUser}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </button>
          </div>

          {/* Dashboard Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#111111] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
              <Users className="text-blue-400 mb-3 w-8 h-8" />
              <h3 className="text-xl font-semibold text-white mb-2">User Management</h3>
              <p className="text-gray-400 text-sm mb-2">Total Users: {users.length}</p>
              <p className="text-gray-400 text-sm">Add, edit, or remove users.</p>
            </div>

            <div className="bg-[#111111] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
              <BarChart className="text-green-400 mb-3 w-8 h-8" />
              <h3 className="text-xl font-semibold text-white mb-2">Analytics</h3>
              <p className="text-gray-400 text-sm mb-2">System Overview</p>
              <p className="text-gray-400 text-sm">Monitor system activity and stats.</p>
            </div>

            <div className="bg-[#111111] p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors">
              <Settings className="text-purple-400 mb-3 w-8 h-8" />
              <h3 className="text-xl font-semibold text-white mb-2">App Settings</h3>
              <p className="text-gray-400 text-sm mb-2">Configuration</p>
              <p className="text-gray-400 text-sm">Configure global settings.</p>
            </div>
          </div>

          {/* Users Table Section */}
          <div className="bg-[#111111] border border-gray-800 rounded-xl p-6">
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
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.isVerified
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          }`}>
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(user._id)}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                              title="Edit User"
                            >
                              <SquarePen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user._id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
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
  );
}