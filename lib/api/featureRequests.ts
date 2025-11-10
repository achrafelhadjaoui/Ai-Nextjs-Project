// lib/api/featureRequests.ts

// Get all feature requests
export async function getFeatureRequests() {
  try {
    const res = await fetch("/api/feature-requests", { cache: "no-store" });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to load feature requests");
    }

    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to load feature requests" };
  }
}

// Create a new feature request
export async function createFeatureRequest(data: {
  title: string;
  description: string;
}) {
  try {
    const res = await fetch("/api/feature-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to create feature request");
    }

    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to create feature request" };
  }
}

// Toggle vote on a feature request
export async function toggleVote(id: string) {
  try {
    const res = await fetch(`/api/feature-requests/${id}/vote`, {
      method: "POST",
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to toggle vote");
    }

    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to toggle vote" };
  }
}

// Update feature request (admin only)
export async function updateFeatureRequest(
  id: string,
  updates: {
    status?: 'pending' | 'in-progress' | 'completed' | 'rejected';
    adminResponse?: string;
  }
) {
  try {
    const res = await fetch(`/api/admin/feature-requests/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update feature request");
    }

    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to update feature request" };
  }
}

// Delete feature request (admin only)
export async function deleteFeatureRequest(id: string) {
  try {
    const res = await fetch(`/api/admin/feature-requests/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to delete feature request");
    }

    return await res.json();
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to delete feature request" };
  }
}
