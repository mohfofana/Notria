import crypto from "crypto";
import jwt from "jsonwebtoken";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

function getJwtRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not set");
  return secret;
}

export type UserRole = "student" | "parent" | "admin";

export type AccessTokenPayload = {
  userId: number;
  role: UserRole;
  phone: string;
};

export const JWTService = {
  signAccessToken(payload: AccessTokenPayload) {
    return jwt.sign(payload, getJwtSecret(), { expiresIn: "15m" });
  },

  verifyAccessToken(token: string) {
    return jwt.verify(token, getJwtSecret()) as AccessTokenPayload;
  },

  signRefreshToken(payload: { userId: number }) {
    return jwt.sign(payload, getJwtRefreshSecret(), { expiresIn: "7d" });
  },

  verifyRefreshToken(token: string) {
    return jwt.verify(token, getJwtRefreshSecret()) as { userId: number };
  },

  hashToken(token: string) {
    return crypto.createHash("sha256").update(token).digest("hex");
  },

  generateOpaqueToken() {
    return crypto.randomBytes(32).toString("base64url");
  },
};
