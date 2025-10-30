import { jwtVerify } from 'jose';

// For middleware (Edge Runtime compatible)
export async function verifyTokenEdge(token: string) {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("⚠️ JWT_SECRET not defined");
      return null;
    }

    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error("Edge token verification failed:", error);
    return null;
  }
}

// Simple token decoder for Edge runtime (no verification)
export function decodeTokenEdge(token: string) {
  try {
    // Simple base64 decoding for payload
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Edge token decoding failed:", error);
    return null;
  }
}