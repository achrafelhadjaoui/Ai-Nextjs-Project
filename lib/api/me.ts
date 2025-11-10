export async function getMe() { 
    try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        return await res.json();
    } catch (error) {
        return { success: false, message: "Failed to load user data" };
    }
}