import { Router } from "express";
import * as c from "../controllers/chat.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
const r = Router();
r.use(protect);
r.route("/rooms").get(c.listRooms).post(c.createRoom);
r.get("/communities/:id/room", c.communityRoom);
r.get("/rooms/:id/messages", c.messages);
export default r;
