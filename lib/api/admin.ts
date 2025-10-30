// // /lib/api/admin.ts
// export async function getUsers() {
//     try {
//         const res = await fetch("/api/admin/users", { cache: "no-store" });
//         console.log("tthuis is second users", res)
//       return await res.json();
//     } catch (error) {
//       console.error("Error fetching users:", error);
//       return { success: false, message: "Failed to load users" };
//     }
//   }
  
//   export async function deleteUser(id: string) {
//     try {
//       const res = await fetch(`/api/admin/users/${id}`, {
//         method: "DELETE",
//       });
//       return await res.json();
//     } catch (error) {
//       console.error("Error deleting user:", error);
//       return { success: false, message: "Failed to delete user" };
//     }
//   }
  









// /lib/api/admin.ts

// 🧩 Get all users
export async function getUsers() {
  try {
    const res = await fetch("/api/admin/users", { cache: "no-store" });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to load users");
    }

    return await res.json();
  } catch (error: any) {
    console.error("💥 Error fetching users:", error);
    return { success: false, message: error.message || "Failed to load users" };
  }
}

// 🗑️ Delete a user
export async function deleteUser(id: string) {
  try {
    const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to delete user");
    }

    return await res.json();
  } catch (error: any) {
    console.error("💥 Error deleting user:", error);
    return { success: false, message: error.message || "Failed to delete user" };
  }
}

// 🔍 Get a single user
export async function getUser(id: string) {
  try {
    const res = await fetch(`/api/admin/users/${id}`, { cache: "no-store" });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to fetch user");
    }

    return await res.json();
  } catch (error: any) {
    console.error("💥 Error fetching user:", error);
    return { success: false, message: error.message || "Failed to fetch user" };
  }
}

// ✏️ Update a user
export async function updateUser(id: string, updates: Record<string, any>) {
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    console.log("ttttttttttttttttttt: ", res);

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update user");
    }

    return await res.json();
  } catch (error: any) {
    console.error("💥 Error updating user:", error);
    return { success: false, message: error.message || "Failed to update user" };
  }
}
