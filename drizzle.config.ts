import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { DATABASE_URL } from "./config";

config({ path: ".env" });

export default defineConfig({
    schema: "./db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: DATABASE_URL,
    },
});
