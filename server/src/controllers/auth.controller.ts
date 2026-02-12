import type { Request, Response } from "express";

import { loginSchema, registerSchema } from "@notria/shared";

import { AuthService } from "../services/auth.service.js";

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

    const result = await AuthService.register({ firstName, lastName, phone, password, role });
    if (!result.ok) {
      if (result.error === "PHONE_IN_USE") return res.status(409).json({ error: "Phone already in use" });
      return res.status(500).json({ error: "Internal error" });
    }

    setRefreshCookie(res, result.refreshToken);

    return res.status(201).json({ user: result.user, accessToken: result.accessToken });
  },

  async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
    }

    const { phone, password } = parsed.data;

    const result = await AuthService.login({ phone, password });
    if (!result.ok) {
      if (result.error === "INVALID_CREDENTIALS") return res.status(401).json({ error: "Invalid credentials" });
      return res.status(500).json({ error: "Internal error" });
    }

    setRefreshCookie(res, result.refreshToken);

    return res.json({ user: result.user, accessToken: result.accessToken });
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) return res.status(401).json({ error: "Missing refresh token" });

    const result = await AuthService.refresh(token);
    if (!result.ok) {
      if (result.error === "INVALID_REFRESH") return res.status(401).json({ error: "Invalid refresh token" });
      return res.status(500).json({ error: "Internal error" });
    }

    return res.json({ accessToken: result.accessToken });
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
    if (token) {
      await AuthService.logout(token);
    }

    clearRefreshCookie(res);
    return res.json({ ok: true });
  },

  async me(req: Request, res: Response) {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });

    const response = await AuthService.getMe(req.user.userId);
    if (!response) return res.status(404).json({ error: "Not found" });

    return res.json(response);
  },
};
