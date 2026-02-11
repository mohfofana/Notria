import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

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
