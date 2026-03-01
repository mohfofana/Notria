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

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function toSafeUser(user: typeof schema.users.$inferSelect): SafeUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
  };
}

function normalizeInviteCode(inviteCode?: string) {
  const normalized = inviteCode?.trim().toUpperCase();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function randomCode(length: number) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * INVITE_CHARS.length);
    code += INVITE_CHARS[index];
  }
  return code;
}

async function generateUniqueStudentInviteCode(database: any) {
  while (true) {
    const code = randomCode(8);
    const existing = await database.query.students.findFirst({
      where: eq(schema.students.inviteCode, code),
    });
    if (!existing) return code;
  }
}

async function generateUniqueParentInviteCode(database: any) {
  while (true) {
    const code = randomCode(8);
    const existing = await database.query.parents.findFirst({
      where: eq(schema.parents.inviteCode, code),
    });
    if (!existing) return code;
  }
}

async function generateUniqueRelationshipInviteCode(database: any) {
  while (true) {
    const code = randomCode(6);
    const existing = await database.query.parentStudents.findFirst({
      where: eq(schema.parentStudents.inviteCode, code),
    });
    if (!existing) return code;
  }
}

async function ensureParentProfile(userId: number, database: any) {
  const parent = await database.query.parents.findFirst({
    where: eq(schema.parents.userId, userId),
  });
  if (parent) {
    if (parent.inviteCode) return parent;
    const inviteCode = await generateUniqueParentInviteCode(database);
    const [updatedParent] = await database
      .update(schema.parents)
      .set({
        inviteCode,
        updatedAt: new Date(),
      })
      .where(eq(schema.parents.id, parent.id))
      .returning();
    return updatedParent;
  }

  const inviteCode = await generateUniqueParentInviteCode(database);
  const [createdParent] = await database
    .insert(schema.parents)
    .values({
      userId,
      inviteCode,
    })
    .returning();

  return createdParent;
}

async function ensureStudentProfile(userId: number, database: any) {
  const student = await database.query.students.findFirst({
    where: eq(schema.students.userId, userId),
  });
  if (student) {
    if (student.inviteCode) return student;
    const inviteCode = await generateUniqueStudentInviteCode(database);
    const [updatedStudent] = await database
      .update(schema.students)
      .set({
        inviteCode,
        updatedAt: new Date(),
      })
      .where(eq(schema.students.id, student.id))
      .returning();
    return updatedStudent;
  }

  const inviteCode = await generateUniqueStudentInviteCode(database);
  const [createdStudent] = await database
    .insert(schema.students)
    .values({
      userId,
      inviteCode,
      country: "Côte d'Ivoire",
      examType: "BEPC",
      grade: "3eme",
    })
    .returning();

  return createdStudent;
}

async function linkParentAndStudent(parentId: number, studentId: number, database: any) {
  const existingLink = await database.query.parentStudents.findFirst({
    where: and(
      eq(schema.parentStudents.parentId, parentId),
      eq(schema.parentStudents.studentId, studentId)
    ),
  });

  if (existingLink) {
    if (!existingLink.isConfirmed) {
      await database
        .update(schema.parentStudents)
        .set({
          isConfirmed: true,
          updatedAt: new Date(),
        })
        .where(eq(schema.parentStudents.id, existingLink.id));
    }
    return;
  }

  const relationshipCode = await generateUniqueRelationshipInviteCode(database);
  await database.insert(schema.parentStudents).values({
    parentId,
    studentId,
    inviteCode: relationshipCode,
    isConfirmed: true,
  });
}

async function linkByInviteCode(input: {
  actorUserId: number;
  actorRole: "student" | "parent" | "admin";
  inviteCode?: string;
  database: any;
}) {
  const normalizedCode = normalizeInviteCode(input.inviteCode);
  if (!normalizedCode) return { ok: true as const };
  if (input.actorRole === "admin") return { ok: false as const, error: "INVALID_LINK_CODE" as const };

  if (input.actorRole === "parent") {
    const parent = await ensureParentProfile(input.actorUserId, input.database);
    const student = await input.database.query.students.findFirst({
      where: eq(schema.students.inviteCode, normalizedCode),
    });
    if (!student) return { ok: false as const, error: "INVALID_LINK_CODE" as const };
    await linkParentAndStudent(parent.id, student.id, input.database);
    return { ok: true as const };
  }

  const student = await ensureStudentProfile(input.actorUserId, input.database);
  const parent = await input.database.query.parents.findFirst({
    where: eq(schema.parents.inviteCode, normalizedCode),
  });
  if (!parent) return { ok: false as const, error: "INVALID_LINK_CODE" as const };
  await linkParentAndStudent(parent.id, student.id, input.database);
  return { ok: true as const };
}

export const AuthService = {
  async register(input: {
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
    role: "student" | "parent" | "admin";
    linkCode?: string;
  }) {
    const existing = await db.query.users.findFirst({ where: eq(schema.users.phone, input.phone) });
    if (existing) {
      return { ok: false as const, error: "PHONE_IN_USE" as const };
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    try {
      return await db.transaction(async (tx) => {
        const [user] = await tx
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
          await ensureParentProfile(user.id, tx);
        } else if (user.role === "student") {
          await ensureStudentProfile(user.id, tx);
        }

        const linkResult = await linkByInviteCode({
          actorUserId: user.id,
          actorRole: user.role as "student" | "parent" | "admin",
          inviteCode: input.linkCode,
          database: tx,
        });
        if (!linkResult.ok) {
          throw new Error(linkResult.error);
        }

        const accessToken = JWTService.signAccessToken({
          userId: user.id,
          role: user.role as any,
          phone: user.phone,
        });

        const refreshToken = JWTService.generateOpaqueToken();
        const refreshTokenHash = JWTService.hashToken(refreshToken);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await tx.insert(schema.refreshTokens).values({
          userId: user.id,
          tokenHash: refreshTokenHash,
          expiresAt,
        });

        return { ok: true as const, user: toSafeUser(user), accessToken, refreshToken };
      });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_LINK_CODE") {
        return { ok: false as const, error: "INVALID_LINK_CODE" as const };
      }
      throw error;
    }
  },

  async login(input: { phone: string; password: string; linkCode?: string }) {
    const user = await db.query.users.findFirst({ where: eq(schema.users.phone, input.phone) });
    if (!user) return { ok: false as const, error: "INVALID_CREDENTIALS" as const };

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) return { ok: false as const, error: "INVALID_CREDENTIALS" as const };

    if (user.role === "parent") {
      await ensureParentProfile(user.id, db);
    } else if (user.role === "student") {
      await ensureStudentProfile(user.id, db);
    }

    const linkResult = await linkByInviteCode({
      actorUserId: user.id,
      actorRole: user.role as "student" | "parent" | "admin",
      inviteCode: input.linkCode,
      database: db,
    });
    if (!linkResult.ok) return { ok: false as const, error: linkResult.error };

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
      const student = await db.query.students.findFirst({
        where: eq(schema.students.userId, user.id),
      });
      if (student) {
        response.student = student;
        const studyPlan = await db.query.studyPlans.findFirst({ where: eq(schema.studyPlans.studentId, student.id) });
        response.hasStudyPlan = !!studyPlan;
        const schedule = await db.query.schedules.findFirst({ where: eq(schema.schedules.studentId, student.id) });
        response.hasSchedule = !!schedule;

        const links = await db.query.parentStudents.findMany({
          where: eq(schema.parentStudents.studentId, student.id),
        });
        const linkedParents = await Promise.all(
          links.map(async (link) => {
            const parent = await db.query.parents.findFirst({
              where: eq(schema.parents.id, link.parentId),
            });
            if (!parent) return null;
            const parentUser = await db.query.users.findFirst({
              where: eq(schema.users.id, parent.userId),
            });
            if (!parentUser) return null;
            return {
              id: parent.id,
              firstName: parentUser.firstName,
              lastName: parentUser.lastName,
              phone: parentUser.phone,
              isConfirmed: link.isConfirmed,
            };
          })
        );
        response.linkedParents = linkedParents.filter(Boolean);
      }
    }

    if (user.role === "parent") {
      const parent = await db.query.parents.findFirst({
        where: eq(schema.parents.userId, user.id),
      });
      if (parent) {
        response.parent = parent;
        const links = await db.query.parentStudents.findMany({
          where: eq(schema.parentStudents.parentId, parent.id),
        });
        const linkedStudents = await Promise.all(
          links.map(async (link) => {
            const student = await db.query.students.findFirst({
              where: eq(schema.students.id, link.studentId),
            });
            if (!student) return null;
            const studentUser = await db.query.users.findFirst({
              where: eq(schema.users.id, student.userId),
            });
            if (!studentUser) return null;
            return {
              id: student.id,
              firstName: studentUser.firstName,
              lastName: studentUser.lastName,
              phone: studentUser.phone,
              isConfirmed: link.isConfirmed,
            };
          })
        );
        response.linkedStudents = linkedStudents.filter(Boolean);
      }
    }

    return response;
  },
};
