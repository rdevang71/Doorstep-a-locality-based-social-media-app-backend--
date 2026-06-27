import "dotenv/config";
import http from "http";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Server } from "socket.io";
import app from "./src/app.js";
import { connectDB } from "./src/config/db.js";
import User from "./src/models/user.model.js";
import ChatRoom from "./src/models/chatRoom.model.js";
import Community from "./src/models/community.model.js";
import Message from "./src/models/message.model.js";
const server = http.createServer(app);
const isSuperAdmin = (user) => user?.role === "super_admin";
const canUseRoom = async (roomId, user, password = "") => {
  const userId = user?._id || user?.id || user;
  const room = await ChatRoom.findById(roomId).select("+passwordHash");
  if (!room) throw new Error("Chat room not found");
  if (isSuperAdmin(user)) return room;
  if (room.isCommunityRoom) {
    const community = await Community.findById(room.community).select("members");
    if (!community) throw new Error("Community not found");
    const member = community.members.some((id) => String(id) === String(userId));
    if (!member) throw new Error("Join this community to use its chat room");
    return room;
  }
  if (room.isDirect) {
    const member = room.directMembers?.some((id) => String(id) === String(userId));
    if (!member) throw new Error("This friend chat is private");
    return room;
  }
  if (room.type === "private") {
    if (!(await bcrypt.compare(String(password), room.passwordHash || ""))) {
      throw new Error("Enter the private room password to continue");
    }
  }
  return room;
};
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});
app.set("io", io);
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = await User.findById(decoded.id).select("name avatar role");
    if (!socket.user) throw new Error();
    next();
  } catch {
    next(new Error("Authentication required"));
  }
});
io.on("connection", (socket) => {
  socket.on("room:join", async (roomId, ack = () => {}) => {
    try {
      await canUseRoom(roomId, socket.user, socket.handshake.auth?.roomPasswords?.[roomId]);
      socket.join(roomId);
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, message: e.message });
    }
  });
  socket.on("room:leave", (roomId) => socket.leave(roomId));
  socket.on("message:send", async ({ roomId, content, password }, ack = () => {}) => {
    try {
      if (!socket.user) throw new Error("Authentication required");
      await canUseRoom(roomId, socket.user, password);
      if (!content?.trim() || content.length > 1000)
        throw new Error("Message must be 1-1000 characters");
      const message = await Message.create({
        room: roomId,
        sender: socket.user.id,
        content: content.trim(),
      });
      await message.populate("sender", "name avatar");
      io.to(roomId).emit("message:new", message);
      ack({ ok: true });
    } catch (e) {
      ack({ ok: false, message: e.message });
    }
  });
});
connectDB()
  .then(() =>
    server.listen(process.env.PORT || 8000, () =>
      console.log(`LocalConnect API on port ${process.env.PORT || 8000}`),
    ),
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });







