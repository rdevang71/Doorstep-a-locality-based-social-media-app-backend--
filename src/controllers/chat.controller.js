import bcrypt from "bcryptjs";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { isCloudinaryConfigured } from "../config/cloudinary.js";
import uploadImageBuffer from "../utils/cloudinaryUpload.js";
import ChatRoom from "../models/chatRoom.model.js";
import Community from "../models/community.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const escapeRegex = (value) =>
  String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);
const isMember = (community, userId) =>
  community.members.some((id) => sameId(id, userId));
const roomSelect = "-passwordHash";
const directKey = (a, b) => [String(a), String(b)].sort().join(":");
const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const hasCloudinaryConfig = isCloudinaryConfigured;

const cleanupLocalFile = (file) =>
  file?.path ? unlink(file.path).catch(() => {}) : Promise.resolve();

const saveAvatarLocally = async (file, req) => {
  const directory = path.resolve("uploads", "chat-rooms");
  await mkdir(directory, { recursive: true });
  const filename = randomUUID() + imageExtensions[file.mimetype];
  await writeFile(path.join(directory, filename), file.buffer);
  return `${req.protocol}://${req.get("host")}/uploads/chat-rooms/${filename}`;
};

const uploadAvatarToCloudinary = (file) => uploadImageBuffer(file, { folder: "localconnect/chat-rooms" });

const uploadAvatar = async (file) => {
  if (!file) return undefined;
  if (!hasCloudinaryConfig()) {
    const e = new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.");
    e.status = 500;
    throw e;
  }

  try {
    const url = await uploadAvatarToCloudinary(file);
    await cleanupLocalFile(file);
    return url;
  } catch (error) {
    const e = new Error(`Cloudinary avatar upload failed: ${error.message || "Unknown Cloudinary error"}`);
    e.status = 502;
    throw e;
  }
};

const generateRoomCode = async () => {
  for (let i = 0; i < 8; i += 1) {
    const code = randomBytes(4).toString("hex").toUpperCase();
    if (!(await ChatRoom.exists({ roomCode: code }))) return code;
  }
  throw new Error("Could not generate a unique room ID");
};

const requireCommunityMember = async (communityId, userId) => {
  const community = await Community.findById(communityId);
  if (!community) {
    const e = new Error("Community not found");
    e.status = 404;
    throw e;
  }
  if (!isMember(community, userId)) {
    const e = new Error("Join this community to use its chat room");
    e.status = 403;
    throw e;
  }
  return community;
};

const canUseRoom = async (room, userId, password = "") => {
  if (room.isCommunityRoom) {
    await requireCommunityMember(room.community, userId);
    return;
  }
  if (room.isDirect) {
    if (!room.directMembers?.some((id) => sameId(id, userId))) {
      const e = new Error("This friend chat is private");
      e.status = 403;
      throw e;
    }
    return;
  }
  if (room.type === "private") {
    const fullRoom = await ChatRoom.findById(room._id).select("+passwordHash");
    if (!(await bcrypt.compare(String(password), fullRoom.passwordHash || ""))) {
      const e = new Error("Enter the private room password to continue");
      e.status = 403;
      throw e;
    }
  }
};

export const createRoom = async (req, res) => {
  const type = req.body.type === "private" ? "private" : "public";
  const password = String(req.body.password || "").trim();
  if (type === "private" && password.length < 4) {
    const e = new Error("Private room password must be at least 4 characters");
    e.status = 400;
    throw e;
  }

  const room = await ChatRoom.create({
    name: req.body.name,
    description: req.body.description,
    avatar: (await uploadAvatar(req.file)) || req.body.avatar,
    type,
    passwordHash: type === "private" ? await bcrypt.hash(password, 10) : undefined,
    roomCode: await generateRoomCode(),
    city: req.body.city || req.user.city,
    locality: req.body.locality || req.user.locality,
    createdBy: req.user.id,
    members: [req.user.id],
  });
  res.status(201).json(await ChatRoom.findById(room._id).select(roomSelect));
};

export const listRooms = async (req, res) =>
  res.json(
    await ChatRoom.find({
      isCommunityRoom: { $ne: true },
      isDirect: { $ne: true },
      ...(req.query.city && {
        city: new RegExp(`^${escapeRegex(req.query.city)}$`, "i"),
      }),
    })
      .select(roomSelect)
      .populate("createdBy", "name avatar")
      .sort("-createdAt"),
  );

export const joinPrivateRoom = async (req, res) => {
  const roomCode = String(req.body.roomCode || "").trim().toUpperCase();
  const password = String(req.body.password || "");
  const room = await ChatRoom.findOne({ roomCode, isCommunityRoom: { $ne: true } }).select(
    "+passwordHash",
  );
  if (!room) {
    const e = new Error("Room not found");
    e.status = 404;
    throw e;
  }
  if (room.type !== "private") {
    const e = new Error("This room is public and does not need a password");
    e.status = 400;
    throw e;
  }
  if (!(await bcrypt.compare(password, room.passwordHash || ""))) {
    const e = new Error("Incorrect room password");
    e.status = 403;
    throw e;
  }
  res.json(await ChatRoom.findById(room._id).select(roomSelect));
};

export const updateRoom = async (req, res) => {
  const room = await ChatRoom.findById(req.params.id).select("+passwordHash");
  if (!room || room.isCommunityRoom) {
    const e = new Error("Chat room not found");
    e.status = 404;
    throw e;
  }
  if (!sameId(room.createdBy, req.user.id)) {
    const e = new Error("Only the room owner can edit this room");
    e.status = 403;
    throw e;
  }

  if (!room.roomCode) room.roomCode = await generateRoomCode();
  const uploadedAvatar = await uploadAvatar(req.file);
  if (uploadedAvatar) room.avatar = uploadedAvatar;

  ["name", "description", "city", "locality"].forEach((key) => {
    if (req.body[key] !== undefined) room[key] = req.body[key];
  });
  if (req.body.type && req.body.type !== room.type) {
    room.type = req.body.type === "private" ? "private" : "public";
    if (room.type === "private") {
      const password = String(req.body.password || "").trim();
      if (password.length < 4) {
        const e = new Error("Private room password must be at least 4 characters");
        e.status = 400;
        throw e;
      }
      room.passwordHash = await bcrypt.hash(password, 10);
    } else {
      room.passwordHash = undefined;
    }
  } else if (room.type === "private" && req.body.password) {
    room.passwordHash = await bcrypt.hash(String(req.body.password), 10);
  }

  await room.save();
  res.json(await ChatRoom.findById(room._id).select(roomSelect));
};


export const friendChats = async (req, res) => {
  const me = await User.findById(req.user.id).populate("friends", "name avatar city locality bio");
  const friendIds = (me?.friends || []).map((friend) => friend._id);
  const rooms = await ChatRoom.find({
    isDirect: true,
    directMembers: req.user.id,
  }).select(roomSelect);
  const roomByFriend = new Map();
  rooms.forEach((room) => {
    const friendId = room.directMembers.find((id) => !sameId(id, req.user.id));
    if (friendId) roomByFriend.set(String(friendId), room);
  });
  res.json(
    (me?.friends || []).map((friend) => ({
      friend,
      room: roomByFriend.get(String(friend._id)) || null,
    })),
  );
};

export const directRoom = async (req, res) => {
  if (sameId(req.params.friendId, req.user.id)) {
    const e = new Error("You cannot chat with yourself");
    e.status = 400;
    throw e;
  }
  const [me, friend] = await Promise.all([
    User.findById(req.user.id),
    User.findById(req.params.friendId).select("name avatar city locality"),
  ]);
  if (!friend) {
    const e = new Error("Friend not found");
    e.status = 404;
    throw e;
  }
  if (!me.friends.some((id) => sameId(id, friend._id))) {
    const e = new Error("You can only start chats with friends");
    e.status = 403;
    throw e;
  }

  const key = directKey(me._id, friend._id);
  const room = await ChatRoom.findOneAndUpdate(
    { directKey: key },
    {
      $setOnInsert: {
        name: `${me.name} and ${friend.name}`,
        description: "Friends-only direct chat",
        roomCode: await generateRoomCode(),
        type: "public",
        city: me.city,
        locality: me.locality,
        createdBy: me._id,
        isDirect: true,
        directMembers: [me._id, friend._id],
        directKey: key,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).select(roomSelect);

  res.json({ friend, room });
};
export const communityRoom = async (req, res) => {
  const community = await requireCommunityMember(req.params.id, req.user.id);
  const room = await ChatRoom.findOneAndUpdate(
    { community: community._id, isCommunityRoom: true },
    {
      $setOnInsert: {
        name: `${community.name} chat`,
        description: `Members-only chat for ${community.name}`,
        roomCode: await generateRoomCode(),
        type: "private",
        city: community.city,
        locality: community.locality,
        community: community._id,
        isCommunityRoom: true,
        createdBy: community.creator,
      },
      $addToSet: { members: req.user.id },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).select(roomSelect);
  res.json(room);
};

export const messages = async (req, res) => {
  const room = await ChatRoom.findById(req.params.id).select(roomSelect);
  if (!room) {
    const e = new Error("Chat room not found");
    e.status = 404;
    throw e;
  }
  await canUseRoom(room, req.user.id, req.query.password);

  res.json(
    await Message.find({ room: room._id })
      .populate("sender", "name avatar")
      .sort("-createdAt")
      .limit(100)
      .then((v) => v.reverse()),
  );
};









