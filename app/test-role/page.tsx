'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { signOut } from 'next-auth/react';

export default function TestRolePage() {
  const { user, loading, isAdmin } = useAuth();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Role Test Page</h1>

        <div className="bg-[#111111] border border-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <span className="text-gray-400">Authenticated:</span>
            <span className="text-white ml-2 font-bold">
              {user ? '✅ Yes' : '❌ No'}
            </span>
          </div>

          {user && (
            <>
              <div>
                <span className="text-gray-400">Name:</span>
                <span className="text-white ml-2">{(user as any).name || 'N/A'}</span>
              </div>

              <div>
                <span className="text-gray-400">Email:</span>
                <span className="text-white ml-2">{(user as any).email || 'N/A'}</span>
              </div>

              <div>
                <span className="text-gray-400">Role:</span>
                <span className="text-white ml-2 font-bold text-xl">
                  {user.role}
                </span>
              </div>

              <div>
                <span className="text-gray-400">Is Admin:</span>
                <span className="text-white ml-2 font-bold text-xl">
                  {isAdmin ? '✅ YES' : '❌ NO'}
                </span>
              </div>

              <div>
                <span className="text-gray-400">Image:</span>
                <span className="text-white ml-2">{(user as any).image || 'N/A'}</span>
              </div>
            </>
          )}

          {!user && (
            <div className="text-red-500">
              Not authenticated. Please login first.
            </div>
          )}
        </div>

        <div className="mt-8 space-y-4">
          <a
            href="/dashboard"
            className="block w-full py-3 bg-white text-black rounded-lg font-medium text-center hover:bg-gray-100 transition"
          >
            Go to Dashboard
          </a>

          {isAdmin && (
            <a
              href="/admin/dashboard"
              className="block w-full py-3 bg-green-600 text-white rounded-lg font-medium text-center hover:bg-green-700 transition"
            >
              Go to Admin Dashboard
            </a>
          )}

          <a
            href="/auth/login"
            className="block w-full py-3 bg-gray-800 text-white rounded-lg font-medium text-center hover:bg-gray-700 transition"
          >
            Login Page
          </a>

          {user && (
            <button
              onClick={handleLogout}
              className="block w-full py-3 bg-red-600 text-white rounded-lg font-medium text-center hover:bg-red-700 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
