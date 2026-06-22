import { Router } from "express";
import { getProfile, updateMe } from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const r = Router();
r.get("/me", protect, getProfile);
r.put("/me", protect, updateMe);
r.get("/:id", getProfile);
export default r;
