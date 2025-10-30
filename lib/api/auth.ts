// // lib/api.ts
// export async function loginUser(data: { email: string; password: string }) {
//     const res = await fetch("/api/auth/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });
//     if (!res.ok) throw new Error("Login failed");
//     return res.json();
//   }
  
//   export async function registerUser(data: { name: string; email: string; password: string }) {
//     const res = await fetch("/api/auth/signup", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });
//     if (!res.ok) throw new Error("Signup failed");
//     return res.json();
//   }
  
//   export async function resetPassword(data: { token: string; newPassword: string }) {
//     const res = await fetch("/api/auth/reset-password", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });
//     if (!res.ok) throw new Error("Password reset failed");
//     return res.json();
//   }

//   export async function forgotPassword(data: { email: string }) {
//     const res = await fetch("/api/auth/forgot-password", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     });
//     if (!res.ok) throw new Error("Forgot password request failed");
//     return res.json();
//   }









// /lib/api.ts
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    const data = await res.json().catch(() => ({})); // handle invalid JSON

    if (!res.ok) {
      // extract message from server or use generic one
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
/* 🧩 LOGIN USER */
/* ------------------------------------------------------- */
export async function loginUser(data: { email: string; password: string }): Promise<ApiResponse> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await handleResponse(res);
  } catch (error: any) {
    console.error("❌ Login request error:", error);
    return { success: false, error: error.message || "Network error during login" };
  }
}

/* ------------------------------------------------------- */
/* 🧩 REGISTER USER */
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

/* ------------------------------------------------------- */
/* 🧩 RESET PASSWORD */
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

/* ------------------------------------------------------- */
/* 🧩 FORGOT PASSWORD */
/* ------------------------------------------------------- */
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
