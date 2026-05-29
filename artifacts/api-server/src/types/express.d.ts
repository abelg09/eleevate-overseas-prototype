import "express";

declare module "express" {
  interface Request {
    clerkUserId?: string;
  }
}
