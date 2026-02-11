import type { UserRole } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: UserRole;
        phone: string;
      };
    }
  }
}

export {};
