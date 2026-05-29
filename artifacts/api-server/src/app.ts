import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

// CORS: exact-match trusted origins. In development (NODE_ENV !== "production") and
// ALLOWED_ORIGINS is unset, fall back to allowing localhost/127.0.0.1 only.
// In production with no ALLOWED_ORIGINS the server fails-closed (denies all cross-origin
// requests) rather than opening a regex back-door.
const rawOrigins = process.env.ALLOWED_ORIGINS;
const allowedOrigins: string[] = rawOrigins
  ? rawOrigins.split(",").map((o) => o.trim()).filter(Boolean)
  : [];
const isProduction = process.env.NODE_ENV === "production";

app.use(
  cors({
    credentials: true,
    origin: (origin, cb) => {
      // Same-origin requests (no Origin header) are always allowed.
      if (!origin) {
        cb(null, true);
        return;
      }
      if (allowedOrigins.length > 0) {
        // Explicit list configured — use exact-match only.
        allowedOrigins.includes(origin)
          ? cb(null, true)
          : cb(new Error("CORS: origin not allowed"));
      } else if (!isProduction) {
        // Development fallback: permit localhost, 127.0.0.1, and Replit dev domains.
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^https:\/\/[a-z0-9-]+(\.[\w-]+)?\.replit\.dev$/.test(origin)
          ? cb(null, true)
          : cb(new Error("CORS: origin not allowed"));
      } else {
        // Production with no ALLOWED_ORIGINS — fail-closed.
        cb(new Error("CORS: origin not allowed (ALLOWED_ORIGINS not configured)"));
      }
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

app.use("/api", router);

export default app;
