import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn(
    "[db] DATABASE_URL is not set. Set it in backend/.env (see .env.example)."
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
