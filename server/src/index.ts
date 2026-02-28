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

const app = express();
const BASE_PORT = Number(process.env.PORT || process.env.SERVER_PORT || 3001);
const MAX_PORT_ATTEMPTS = 10;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
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
