import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export const requireRole = (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const clerkUserId = req.clerkUserId;
    if (!clerkUserId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.clerkId, clerkUserId),
    });
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: `Forbidden: requires one of [${roles.join(", ")}] role` });
      return;
    }
    next();
  };
