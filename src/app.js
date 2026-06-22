import "express-async-errors";
import express from "express";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import auth from "./routes/auth.routes.js";
import users from "./routes/user.routes.js";
import posts from "./routes/post.routes.js";
import hashtags from "./routes/hashtag.routes.js";
import summaries from "./routes/summary.routes.js";
import businesses from "./routes/business.routes.js";
import communities from "./routes/community.routes.js";
import events from "./routes/event.routes.js";
import chats from "./routes/chat.routes.js";
import notifications from "./routes/notification.routes.js";
import reports from "./routes/report.routes.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";
const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL?.split(",") || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(
  "/uploads",
  express.static(path.resolve("uploads"), {
    setHeaders: (res) =>
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "LocalConnect API" }),
);
[
  ["auth", auth],
  ["users", users],
  ["posts", posts],
  ["hashtags", hashtags],
  ["summaries", summaries],
  ["business-pages", businesses],
  ["communities", communities],
  ["events", events],
  ["chat", chats],
  ["notifications", notifications],
  ["reports", reports],
].forEach(([path, router]) => app.use(`/api/${path}`, router));
app.use(notFound);
app.use(errorHandler);
export default app;
