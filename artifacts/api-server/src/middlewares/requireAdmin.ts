import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: admin role required" });
    return;
  }
  req.clerkUserId = userId;
  next();
};
