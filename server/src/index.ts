import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import { authRouter } from "./routes/auth.routes.js";
import { studentRouter } from "./routes/student.routes.js";
import { studyPlanRouter } from "./routes/studyplan.routes.js";
import { scheduleRouter } from "./routes/schedule.routes.js";

dotenv.config({ path: "../.env" });

const app = express();
const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 3001);

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
