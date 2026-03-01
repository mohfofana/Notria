import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";

let sentryLoaded = false;
let sentryModule: any = null;

async function ensureSentry() {
  if (sentryLoaded) return sentryModule;
  sentryLoaded = true;
  if (!process.env.SENTRY_DSN) return null;
  try {
    const importFn = new Function("m", "return import(m);") as (m: string) => Promise<any>;
    const mod = await importFn("@sentry/node");
    mod.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: 0.1,
    });
    sentryModule = mod;
    return sentryModule;
  } catch (error) {
    console.warn("Sentry not available, continuing without it:", error);
    return null;
  }
}

export function withRequestId(req: Request, res: Response, next: NextFunction) {
  const incoming = req.header("x-request-id");
  const requestId = incoming && incoming.trim().length > 0 ? incoming : crypto.randomUUID();
  (req as Request & { requestId?: string }).requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}

export function requestLogger(req: Request, _res: Response, next: NextFunction) {
  const requestId = (req as Request & { requestId?: string }).requestId || "unknown";
  (req as Request & { log?: (...args: unknown[]) => void }).log = (...args: unknown[]) => {
    console.log(`[req:${requestId}]`, ...args);
  };
  next();
}

export async function captureServerError(error: unknown, req: Request) {
  const requestId = (req as Request & { requestId?: string }).requestId || "unknown";
  console.error(`[req:${requestId}]`, error);
  const sentry = await ensureSentry();
  if (sentry) {
    sentry.captureException(error, {
      tags: {
        requestId,
      },
    });
  }
}
