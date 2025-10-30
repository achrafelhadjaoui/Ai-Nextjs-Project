export async function getMe() { 
    try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        console.log("Fetched user data:", res);
        return await res.json();
    } catch (error) {
        console.error("Error fetching user data:", error);
        return { success: false, message: "Failed to load user data" };
    }
}