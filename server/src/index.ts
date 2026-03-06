import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import "./lib/load-env.js";

import { authRouter } from "./routes/auth.routes.js";
import { studentRouter } from "./routes/student.routes.js";
import { studyPlanRouter } from "./routes/studyplan.routes.js";
import { scheduleRouter } from "./routes/schedule.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import assessmentRouter from "./routes/assessment.routes.js";
import sessionRouter from "./routes/session.routes.js";
import parentRouter from "./routes/parent.routes.js";
import ragRouter from "./routes/rag.routes.js";
import guidedSessionRouter from "./routes/guided-session.routes.js";
import adminRouter from "./routes/admin.routes.js";
import courseProgramRouter from "./routes/course-program.routes.js";
import { captureServerError, requestLogger, withRequestId } from "./observability/http-observability.js";

const app = express();
const BASE_PORT = Number(process.env.PORT || process.env.SERVER_PORT || 3001);
const MAX_PORT_ATTEMPTS = 10;
const defaultOrigins = [
  "http://localhost:4000",
  "http://127.0.0.1:4000",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((value) => value.trim()).filter(Boolean)
  : [];
const allowedOrigins = Array.from(new Set([...configuredOrigins, ...defaultOrigins]));
const isDev = (process.env.NODE_ENV || "development") !== "production";
const devLanOriginPattern = /^http:\/\/(?:(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}|(?:172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})|(?:192\.168\.\d{1,3}\.\d{1,3})):(3000|4000)$/;

// Middleware
app.use(helmet());
app.use(withRequestId);
app.use(requestLogger);
app.use(cors({
  origin(origin, callback) {
    // Non-browser requests (curl/server-to-server) may not send Origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (isDev && devLanOriginPattern.test(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/students", studentRouter);
app.use("/api/study-plans", studyPlanRouter);
app.use("/api/schedules", scheduleRouter);
app.use("/api/chat", chatRouter);
app.use("/api/assessment", assessmentRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/parent", parentRouter);
app.use("/api/rag", ragRouter);
app.use("/api/guided-sessions", guidedSessionRouter);
app.use("/api/admin", adminRouter);
app.use("/api/course-program", courseProgramRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Routes will be added here
app.get("/", (req, res) => {
  res.json({ message: "Notria API Server" });
});

app.use(async (error: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  await captureServerError(error, req);
  if (!res.headersSent) {
    res.status(500).json({ error: "Internal server error" });
  }
});

function startServer(port: number, attemptsLeft: number): void {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE" && attemptsLeft > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} is already in use. Retrying on port ${nextPort}...`);
      startServer(nextPort, attemptsLeft - 1);
      return;
    }

    throw error;
  });
}

startServer(BASE_PORT, MAX_PORT_ATTEMPTS);
