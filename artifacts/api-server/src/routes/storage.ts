import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import { z } from "zod/v4";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { requireAuth } from "../middlewares/requireAuth";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const RequestUploadUrlBody = z.object({
  name: z.string().min(1),
  size: z.number().positive(),
  contentType: z.string().min(1),
});

const RequestUploadUrlResponse = z.object({
  uploadURL: z.string(),
  objectPath: z.string(),
  metadata: z.object({ name: z.string(), size: z.number(), contentType: z.string() }),
});

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

async function getInternalUserId(clerkId: string): Promise<string | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return user?.id ?? null;
}

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The resulting objectPath embeds the uploader's internal userId as its first segment
 * (e.g. /objects/<userId>/<uuid>). This binds ownership into the path itself — no
 * additional DB lookup or ACL metadata is required to prove ownership at read time.
 */
router.post("/storage/uploads/request-url", requireAuth, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const userId = await getInternalUserId(req.clerkUserId!);
    if (!userId) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const { name, size, contentType } = parsed.data;

    // userId is embedded in the path: /objects/<userId>/<uuid>
    const uploadURL = await objectStorageService.getObjectEntityUploadURL(userId);
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * Unconditionally public — no authentication or ACL checks.
 */
router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

/**
 * GET /storage/objects/:ownerUserId/*
 *
 * Serve private object entities.
 * Authorization: the first path segment (:ownerUserId) MUST match the requester's
 * own internal user ID. This is race-condition-free because the server embeds the
 * userId into the path at presigned-URL issuance time (see POST above).
 *
 * Attack scenario closed: even if a malicious user discovers another user's object
 * path (e.g. /objects/<victimId>/<uuid>), the path's first segment won't match
 * the attacker's own userId, so access is denied.
 */
router.get("/storage/objects/:ownerUserId/*path", requireAuth, async (req: Request, res: Response) => {
  try {
    const { ownerUserId } = req.params as { ownerUserId: string };
    const raw = req.params.path;
    const rest = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${ownerUserId}/${rest}`;

    // Ownership check: the path's owner segment must match the requester's userId.
    const requestingUserId = await getInternalUserId(req.clerkUserId!);
    if (!requestingUserId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (requestingUserId !== ownerUserId) {
      req.log.warn({ requestingUserId, ownerUserId, objectPath }, "Object access denied — userId mismatch");
      res.status(403).json({ error: "Forbidden — you do not own this object" });
      return;
    }

    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
