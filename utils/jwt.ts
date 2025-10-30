// import jwt from "jsonwebtoken";

// const JWT_SECRET = process.env.JWT_SECRET as string;

// if (!JWT_SECRET) {
//   throw new Error("⚠️ Please define JWT_SECRET in your .env.local file");
// }

// export function signToken(payload: object) {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" }); // 7 days validity
// }

// export function verifyToken(token: string) {
//   try {
//     return jwt.verify(token, JWT_SECRET);
//   } catch {
//     return null;
//   }
// }



// // /utils/jwt.ts
// import jwt from "jsonwebtoken";

// // Server-side JWT functions
// export function signToken(payload: object) {
//   const JWT_SECRET = process.env.JWT_SECRET;
//   if (!JWT_SECRET) {
//     throw new Error("⚠️ Please define JWT_SECRET in your .env.local file");
//   }
//   return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
// }

// export function verifyToken(token: string) {
//   const JWT_SECRET = process.env.JWT_SECRET;
//   if (!JWT_SECRET) {
//     throw new Error("⚠️ Please define JWT_SECRET in your .env.local file");
//   }
//   try {
//     return jwt.verify(token, JWT_SECRET);
//   } catch(err) {
//     console.error("Token verification failed:", err);
//     return err;
//   }
// }

// Client-side safe token decoder (doesn't verify signature, just decodes)
// export function decodeToken(token: string) {
//   try {
//     // jwt.decode doesn't verify the signature, it just decodes the payload
//     return jwt.decode(token);
//   } catch {
//     return null;
//   }
// }



import jwt from "jsonwebtoken";

// Server-side JWT functions
export function signToken(payload: object) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("⚠️ Please define JWT_SECRET in your .env.local file");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("⚠️ Please define JWT_SECRET in your .env.local file");
  }
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch(err) {
    console.error("Token verification failed:", err);
    return null;
  }
}

// Client-side safe token decoder (doesn't verify signature, just decodes)
export function decodeToken(token: string) {
  try {
    // jwt.decode doesn't verify the signature, it just decodes the payload
    return jwt.decode(token);
  } catch {
    return null;
  }
}