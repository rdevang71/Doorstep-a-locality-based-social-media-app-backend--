import { Router } from "express";
import {
  acceptFriend,
  getProfile,
  rejectFriend,
  requestFriend,
  updateMe,
} from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
const r = Router();
r.get("/me", protect, getProfile);
r.put("/me", protect, upload.single("avatar"), updateMe);
r.put("/:id/friend-request", protect, requestFriend);
r.put("/:id/friend-accept", protect, acceptFriend);
r.put("/:id/friend-reject", protect, rejectFriend);
r.get("/:id", getProfile);
export default r;

