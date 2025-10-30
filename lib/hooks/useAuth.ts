// 'use client';

// import { useState, useEffect } from 'react';
// import { decodeToken } from '@/utils/jwt';

// export function useAuth() {
//   const [user, setUser] = useState<{ role: string } | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const getTokenFromCookies = () => {
//     //   if (typeof window === 'undefined') return null;
      
//       const cookieValue = document.cookie
//         .split('; ')
//         .find(row => row.startsWith('token='))
//         ?.split('=')[1];

//       return cookieValue || null;
//     };

//       const token = getTokenFromCookies();
//       console.log('Fetching token from cookies...', token);

//     if (token) {
//       try {
//         // Use decodeToken instead of verifyToken for client-side
//         const decoded = decodeToken(token) as any;
//         setUser({
//           role: decoded?.role || 'user'
//         });
//       } catch (error) {
//         console.error('Error decoding token:', error);
//         setUser(null);
//       }
//     } else {
//       setUser(null);
//     }
//     setLoading(false);
//   }, []);

//   return {
//     user,
//     loading,
//     isAuthenticated: !!user,
//     isAdmin: user?.role === 'admin'
//   };
// }



'use client';

import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!res.ok) throw new Error('Unauthorized');

        const data = await res.json();
        console.log('[useAuth] User data:', data.user);
        setUser(data.user);
      } catch (error) {
        console.error('[useAuth] Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };
}
