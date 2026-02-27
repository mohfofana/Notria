import dotenv from "dotenv";

// Load local overrides first, then fallback to .env
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
