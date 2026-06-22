import { Router } from "express";
import * as c from "../controllers/business.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const r = Router();
r.route("/").get(c.list).post(protect, c.create);
r.put("/:id/follow", protect, c.follow);
r.route("/:id").get(c.get).put(protect, c.update).delete(protect, c.remove);
export default r;
