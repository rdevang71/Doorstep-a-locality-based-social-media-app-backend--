import { Router } from "express";
import * as c from "../controllers/chat.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
const r = Router();
r.use(protect);
r.route("/rooms").get(c.listRooms).post(upload.single("avatar"), c.createRoom);
r.post("/rooms/join", c.joinPrivateRoom);
r.get("/friends", c.friendChats);
r.post("/direct/:friendId", c.directRoom);
r.put("/rooms/:id", upload.single("avatar"), c.updateRoom);
r.delete("/rooms/:id", c.deleteRoom);
r.get("/communities/:id/room", c.communityRoom);
r.get("/rooms/:id/messages", c.messages);
export default r;


