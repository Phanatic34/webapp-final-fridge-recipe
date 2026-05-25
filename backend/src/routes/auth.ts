import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { JWT_SECRET } from "../middleware/auth.js";

const router = Router();
const SALT_ROUNDS = 10;

type UserRow = { id: number; email: string; display_name: string; password_hash: string };

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const { email, display_name, password } = req.body as {
    email?: string;
    display_name?: string;
    password?: string;
  };

  if (!email?.trim() || !display_name?.trim() || !password) {
    res.status(400).json({ error: "email, display_name and password are required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "密碼至少需要 6 個字元" });
    return;
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query<UserRow>(
      `INSERT INTO users (email, display_name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name, password_hash`,
      [email.toLowerCase().trim(), display_name.trim(), hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({ token, user: { id: user.id, email: user.email, display_name: user.display_name } });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && (e as { code: string }).code === "23505") {
      res.status(409).json({ error: "此 Email 已被註冊" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "註冊失敗" });
  }
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email?.trim() || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }

  try {
    const result = await pool.query<UserRow>(
      `SELECT id, email, display_name, password_hash FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: "Email 或密碼錯誤" });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: "Email 或密碼錯誤" });
      return;
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user: { id: user.id, email: user.email, display_name: user.display_name } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "登入失敗" });
  }
});

export default router;
