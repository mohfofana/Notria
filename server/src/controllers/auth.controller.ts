import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";

import { loginSchema, registerSchema } from "@notria/shared";

import { db, schema } from "../db";
import { JWTService } from "../utils/jwt";

const REFRESH_COOKIE_NAME = "notria_refresh";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
}

export const AuthController = {
  async register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { firstName, lastName, phone, password, role } = parsed.data;

    const existing = await db.query.users.findFirst({ where: eq(schema.users.phone, phone) });
    if (existing) {
      return res.status(409).json({ error: "Phone already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(schema.users)
      .values({
        firstName,
        lastName,
        phone,
        role,
        passwordHash,
        email: null,
      })
      .returning();

    const accessToken = JWTService.signAccessToken({ userId: user.id, role: user.role as any, phone: user.phone });

    const refreshToken = JWTService.generateOpaqueToken();
    const refreshTokenHash = JWTService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(schema.refreshTokens).values({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role },
      accessToken,
    });
  },

  async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { phone, password } = parsed.data;

    const user = await db.query.users.findFirst({ where: eq(schema.users.phone, phone) });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const accessToken = JWTService.signAccessToken({ userId: user.id, role: user.role as any, phone: user.phone });

    const refreshToken = JWTService.generateOpaqueToken();
    const refreshTokenHash = JWTService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(schema.refreshTokens).values({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    setRefreshCookie(res, refreshToken);

    return res.json({
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role },
      accessToken,
    });
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) return res.status(401).json({ error: "Missing refresh token" });

    const tokenHash = JWTService.hashToken(token);
    const now = new Date();

    const existing = await db.query.refreshTokens.findFirst({
      where: and(eq(schema.refreshTokens.tokenHash, tokenHash), gt(schema.refreshTokens.expiresAt, now)),
    });

    if (!existing) return res.status(401).json({ error: "Invalid refresh token" });

    const user = await db.query.users.findFirst({ where: eq(schema.users.id, existing.userId) });
    if (!user) return res.status(401).json({ error: "Invalid refresh token" });

    const accessToken = JWTService.signAccessToken({ userId: user.id, role: user.role as any, phone: user.phone });

    return res.json({ accessToken });
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (token) {
      const tokenHash = JWTService.hashToken(token);
      await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.tokenHash, tokenHash));
    }

    clearRefreshCookie(res);
    return res.json({ ok: true });
  },

  async me(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const user = await db.query.users.findFirst({ where: eq(schema.users.id, req.user.userId) });
    if (!user) return res.status(404).json({ error: "Not found" });

    return res.json({
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role },
    });
  },
};
