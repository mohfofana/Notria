import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";

import { db, schema } from "../db/index.js";

type UserRole = "student" | "parent" | "admin";

export const AdminService = {
  async getOverview() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [usersCount] = await db.select({ value: sql<number>`count(*)` }).from(schema.users);
    const [studentsCount] = await db.select({ value: sql<number>`count(*)` }).from(schema.students);
    const [parentsCount] = await db.select({ value: sql<number>`count(*)` }).from(schema.parents);
    const [conversationsCount] = await db
      .select({ value: sql<number>`count(*)` })
      .from(schema.conversations)
      .where(eq(schema.conversations.isActive, true));
    const [messagesCount] = await db.select({ value: sql<number>`count(*)` }).from(schema.messages);
    const [sessions7dCount] = await db
      .select({ value: sql<number>`count(*)` })
      .from(schema.studySessions)
      .where(gte(schema.studySessions.createdAt, sevenDaysAgo));

    const roleBreakdownRows = await db
      .select({
        role: schema.users.role,
        count: sql<number>`count(*)`,
      })
      .from(schema.users)
      .groupBy(schema.users.role);

    const roleBreakdown = roleBreakdownRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.role] = Number(row.count);
      return acc;
    }, {});

    return {
      users: Number(usersCount?.value ?? 0),
      students: Number(studentsCount?.value ?? 0),
      parents: Number(parentsCount?.value ?? 0),
      activeConversations: Number(conversationsCount?.value ?? 0),
      messages: Number(messagesCount?.value ?? 0),
      sessionsLast7Days: Number(sessions7dCount?.value ?? 0),
      roleBreakdown,
    };
  },

  async listUsers(params: { role?: UserRole; search?: string; limit?: number }) {
    const limit = Math.max(1, Math.min(params.limit ?? 50, 200));
    const where = and(
      params.role ? eq(schema.users.role, params.role) : undefined,
      params.search
        ? or(
            ilike(schema.users.firstName, `%${params.search}%`),
            ilike(schema.users.lastName, `%${params.search}%`),
            ilike(schema.users.phone, `%${params.search}%`)
          )
        : undefined
    );

    const users = await db.query.users.findMany({
      where,
      orderBy: [desc(schema.users.createdAt)],
      limit,
    });

    const enriched = await Promise.all(
      users.map(async (user) => {
        let studentId: number | null = null;
        let parentId: number | null = null;

        if (user.role === "student") {
          const student = await db.query.students.findFirst({
            where: eq(schema.students.userId, user.id),
          });
          studentId = student?.id ?? null;
        }

        if (user.role === "parent") {
          const parent = await db.query.parents.findFirst({
            where: eq(schema.parents.userId, user.id),
          });
          parentId = parent?.id ?? null;
        }

        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
          studentId,
          parentId,
        };
      })
    );

    return enriched;
  },

  async updateUserStatus(userId: number, isActive: boolean) {
    const [updated] = await db
      .update(schema.users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(schema.users.id, userId))
      .returning({
        id: schema.users.id,
        isActive: schema.users.isActive,
      });

    return updated ?? null;
  },

  async getActivity(limit = 20) {
    const normalizedLimit = Math.max(1, Math.min(limit, 100));

    const recentSessions = await db.query.studySessions.findMany({
      orderBy: [desc(schema.studySessions.createdAt)],
      limit: normalizedLimit,
    });

    const recentConversations = await db.query.conversations.findMany({
      orderBy: [desc(schema.conversations.updatedAt)],
      limit: normalizedLimit,
    });

    return {
      recentSessions,
      recentConversations,
    };
  },
};
