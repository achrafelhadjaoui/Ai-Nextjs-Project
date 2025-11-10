// lib/api.ts - REMOVE loginUser function
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message = data?.error || data?.message || "Something went wrong";
      return { success: false, error: message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("❌ Response handling error:", err);
    return { success: false, error: "Invalid response format" };
  }
}

/* ------------------------------------------------------- */
/* 🧩 REGISTER USER - KEEP THIS */
/* ------------------------------------------------------- */
export async function registerUser(data: { name: string; email: string; password: string }): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error: any) {
    console.error("❌ Signup request error:", error);
    return { success: false, error: error.message || "Network error during signup" };
  }
}

// Remove loginUser function - use signIn() from next-auth/react instead

/* ------------------------------------------------------- */
/* 🧩 RESET PASSWORD - KEEP THESE */
/* ------------------------------------------------------- */
export async function resetPassword(data: { token: string; newPassword: string }): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error: any) {
    console.error("❌ Reset password request error:", error);
    return { success: false, error: error.message || "Network error during password reset" };
  }
}

export async function forgotPassword(data: { email: string }): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error: any) {
    console.error("❌ Forgot password request error:", error);
    return { success: false, error: error.message || "Network error during forgot password" };
  }
}