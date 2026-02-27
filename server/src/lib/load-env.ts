import dotenv from "dotenv";
import path from "node:path";

// Load local overrides first, then fallback to .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "..", "..", ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "..", "..", ".env") });
