import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import ingredientsRouter from "./routes/ingredients.js";
import recipesRouter from "./routes/recipes.js";

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

app.use("/api/ingredients", ingredientsRouter);
app.use("/api/recipes", recipesRouter);

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
