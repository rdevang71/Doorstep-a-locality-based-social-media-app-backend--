import { Router } from "express";
import * as c from "../controllers/event.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const r = Router();
r.route("/").get(c.list).post(protect, c.create);
r.get("/:id", c.get);
r.put("/:id/join", protect, c.join);
r.put("/:id/leave", protect, c.leave);
export default r;
