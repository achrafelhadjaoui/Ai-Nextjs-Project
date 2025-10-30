'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { getUsers, deleteUser } from '@/lib/api/admin';

export default function ManageUsersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    getUsers().then((res) => {
      if (res.success) setUsers(res.data);
    });
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-6">Manage Users</h1>
        <table className="min-w-full border border-gray-800 rounded-lg text-gray-300">
          <thead className="bg-[#111111]">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Email</th>
              <th className="py-3 px-4 text-left">Role</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-gray-800">
                <td className="py-3 px-4">{u.name}</td>
                <td className="py-3 px-4">{u.email}</td>
                <td className="py-3 px-4">{u.role}</td>
                <td className="py-3 px-4">
                  <button
                    className="text-red-400 hover:text-red-500"
                    onClick={() => deleteUser(u._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
