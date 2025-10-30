/**
 * Client-side logout function
 * Calls the logout API and handles redirect
 */
export async function logoutUser() {
  try {
    // Call logout API
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('onboarding_done');
        // Add any other localStorage items to clear
      }

      // Redirect to login page
      window.location.href = '/auth/login';
      return { success: true };
    } else {
      console.error('Logout failed:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Even on error, redirect to login
    window.location.href = '/auth/login';
    return { success: false, error: 'Network error' };
  }
}
