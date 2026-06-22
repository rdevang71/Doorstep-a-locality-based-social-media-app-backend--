import { Router } from "express";
import { areaSummary } from "../controllers/summary.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const r = Router();
r.post("/area", protect, areaSummary);
export default r;
