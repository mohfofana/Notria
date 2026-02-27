import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import path from "node:path";

config({ path: ".env.local" });
config({ path: ".env" });
config({ path: path.resolve(process.cwd(), "..", ".env.local") });
config({ path: path.resolve(process.cwd(), "..", ".env") });
config({ path: path.resolve(process.cwd(), "..", "..", ".env.local") });
config({ path: path.resolve(process.cwd(), "..", "..", ".env") });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
