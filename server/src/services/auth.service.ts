import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";

import { db, schema } from "../db/index.js";
import { JWTService } from "../utils/jwt.js";

type SafeUser = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
};

function toSafeUser(user: typeof schema.users.$inferSelect): SafeUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
  };
}

export const AuthService = {
  async register(input: {
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    role: "student" | "parent" | "admin";
  }) {
    const existing = await db.query.users.findFirst({ where: eq(schema.users.phone, input.phone) });
    if (existing) {
      return { ok: false as const, error: "PHONE_IN_USE" as const };
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const [user] = await db
      .insert(schema.users)
      .values({
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: input.role,
        passwordHash,
        email: null,
      })
      .returning();

    if (user.role === "parent") {
      await db.insert(schema.parents).values({
        userId: user.id,
      });
    }

    const accessToken = JWTService.signAccessToken({
      userId: user.id,
      role: user.role as any,
      phone: user.phone,
    });

    const refreshToken = JWTService.generateOpaqueToken();
    const refreshTokenHash = JWTService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(schema.refreshTokens).values({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    return { ok: true as const, user: toSafeUser(user), accessToken, refreshToken };
  },

  async login(input: { phone: string; password: string }) {
    const user = await db.query.users.findFirst({ where: eq(schema.users.phone, input.phone) });
    if (!user) return { ok: false as const, error: "INVALID_CREDENTIALS" as const };

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) return { ok: false as const, error: "INVALID_CREDENTIALS" as const };

    const accessToken = JWTService.signAccessToken({
      userId: user.id,
      role: user.role as any,
      phone: user.phone,
    });

    const refreshToken = JWTService.generateOpaqueToken();
    const refreshTokenHash = JWTService.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await db.insert(schema.refreshTokens).values({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    return { ok: true as const, user: toSafeUser(user), accessToken, refreshToken };
  },

  async refresh(refreshToken: string) {
    const tokenHash = JWTService.hashToken(refreshToken);
    const now = new Date();

    const existing = await db.query.refreshTokens.findFirst({
      where: and(eq(schema.refreshTokens.tokenHash, tokenHash), gt(schema.refreshTokens.expiresAt, now)),
    });

    if (!existing) return { ok: false as const, error: "INVALID_REFRESH" as const };

    const user = await db.query.users.findFirst({ where: eq(schema.users.id, existing.userId) });
    if (!user) return { ok: false as const, error: "INVALID_REFRESH" as const };

    const accessToken = JWTService.signAccessToken({
      userId: user.id,
      role: user.role as any,
      phone: user.phone,
    });

    return { ok: true as const, accessToken };
  },

  async logout(refreshToken: string) {
    const tokenHash = JWTService.hashToken(refreshToken);
    await db.delete(schema.refreshTokens).where(eq(schema.refreshTokens.tokenHash, tokenHash));
  },

  async getMe(userId: number) {
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
    if (!user) return null;

    const response: Record<string, unknown> = {
      user: toSafeUser(user),
    };

    if (user.role === "student") {
      const student = await db.query.students.findFirst({ where: eq(schema.students.userId, user.id) });
      if (student) {
        response.student = student;
        const studyPlan = await db.query.studyPlans.findFirst({ where: eq(schema.studyPlans.studentId, student.id) });
        response.hasStudyPlan = !!studyPlan;
        const schedule = await db.query.schedules.findFirst({ where: eq(schema.schedules.studentId, student.id) });
        response.hasSchedule = !!schedule;
      }
    }

    return response;
  },
};
