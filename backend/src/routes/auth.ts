import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/pool.js";
import { requireAuth, JWT_SECRET } from "../middleware/auth.js";

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

// GET /api/auth/me
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query<{ id: string; email: string; display_name: string }>(
      "SELECT id, email, display_name FROM users WHERE id = $1",
      [req.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PATCH /api/auth/me — update display_name and/or password
router.patch("/me", requireAuth, async (req: Request, res: Response) => {
  const { display_name, current_password, new_password } = req.body as {
    display_name?: string;
    current_password?: string;
    new_password?: string;
  };

  try {
    const userResult = await pool.query<UserRow>(
      "SELECT id, email, display_name, password_hash FROM users WHERE id = $1",
      [req.userId]
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const user = userResult.rows[0];

    const fields: string[] = [];
    const values: unknown[] = [];

    if (display_name !== undefined) {
      if (!display_name.trim()) {
        res.status(400).json({ error: "顯示名稱不能為空" });
        return;
      }
      fields.push(`display_name = $${fields.length + 1}`);
      values.push(display_name.trim());
    }

    if (new_password !== undefined) {
      if (!current_password) {
        res.status(400).json({ error: "請輸入目前的密碼" });
        return;
      }
      const valid = await bcrypt.compare(current_password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: "目前密碼不正確" });
        return;
      }
      if (new_password.length < 6) {
        res.status(400).json({ error: "新密碼至少需要 6 個字元" });
        return;
      }
      const hash = await bcrypt.hash(new_password, SALT_ROUNDS);
      fields.push(`password_hash = $${fields.length + 1}`);
      values.push(hash);
    }

    if (fields.length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    values.push(req.userId);
    const result = await pool.query<{ id: string; email: string; display_name: string }>(
      `UPDATE users SET ${fields.join(", ")} WHERE id = $${fields.length + 1} RETURNING id, email, display_name`,
      values
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update user" });
  }
});

export default router;
