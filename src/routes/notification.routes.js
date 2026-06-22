import { Router } from "express";
import * as c from "../controllers/notification.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const r = Router();
r.use(protect);
r.get("/", c.list);
r.put("/read-all", c.markRead);
r.put("/:id/read", c.markRead);
export default r;
