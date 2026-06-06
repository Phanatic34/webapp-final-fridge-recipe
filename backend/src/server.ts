import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import ingredientsRouter from "./routes/ingredients.js";
import favoritesRouter from "./routes/favorites.js";
import recipesRouter from "./routes/recipes.js";
import settingsRouter from "./routes/settings.js";
import shoppingListRouter from "./routes/shopping-list.js";
import { requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/ingredients", requireAuth, ingredientsRouter);
app.use("/api/recipes", requireAuth, recipesRouter);
app.use("/api/favorites", requireAuth, favoritesRouter);
app.use("/api/settings", requireAuth, settingsRouter);
app.use("/api/shopping-list", requireAuth, shoppingListRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
