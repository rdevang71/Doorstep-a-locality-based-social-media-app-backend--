import { Router } from "express";
import * as c from "../controllers/report.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { allowRoles } from "../middlewares/role.middleware.js";
const r = Router();
r.post("/", protect, c.create);
r.get("/", protect, allowRoles("moderator", "admin"), c.list);
r.put("/:id", protect, allowRoles("moderator", "admin"), c.update);
export default r;
