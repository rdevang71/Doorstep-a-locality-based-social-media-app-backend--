import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { isCloudinaryConfigured } from "../config/cloudinary.js";
import uploadImageBuffer from "../utils/cloudinaryUpload.js";
import User from "../models/user.model.js";
import createNotification from "../utils/createNotification.js";

const profileSelect = "-password";
const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);
const listFromText = (value) =>
  Array.isArray(value)
    ? value.map(String).map((v) => v.trim()).filter(Boolean)
    : String(value || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

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
  const directory = path.resolve("uploads", "profiles");
  await mkdir(directory, { recursive: true });
  const filename = randomUUID() + imageExtensions[file.mimetype];
  await writeFile(path.join(directory, filename), file.buffer);
  return `${req.protocol}://${req.get("host")}/uploads/profiles/${filename}`;
};

const uploadAvatarToCloudinary = (file) => uploadImageBuffer(file, { folder: "localconnect/profiles" });

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

const populateProfile = (query) =>
  query
    .select(profileSelect)
    .populate("friends", "name avatar city locality bio")
    .populate("friendRequests.from", "name avatar city locality");

export const getProfile = async (req, res) => {
  const user = await populateProfile(User.findById(req.params.id || req.user.id));
  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }
  res.json(user);
};

export const updateMe = async (req, res) => {
  const allowed = [
    "name",
    "bio",
    "avatar",
    "city",
    "locality",
    "pincode",
    "occupation",
    "education",
  ];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k)),
  );
  if (req.body.interests !== undefined) updates.interests = listFromText(req.body.interests);
  if (req.body.hobbies !== undefined) updates.hobbies = listFromText(req.body.hobbies);
  const uploadedAvatar = await uploadAvatar(req.file);
  if (uploadedAvatar) updates.avatar = uploadedAvatar;
  res.json(
    await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select(profileSelect),
  );
};

export const requestFriend = async (req, res) => {
  if (sameId(req.params.id, req.user.id)) {
    const e = new Error("You cannot add yourself as a friend");
    e.status = 400;
    throw e;
  }
  const [me, target] = await Promise.all([
    User.findById(req.user.id),
    User.findById(req.params.id),
  ]);
  if (!target) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }
  if (me.friends.some((id) => sameId(id, target._id))) {
    const e = new Error("You are already friends");
    e.status = 409;
    throw e;
  }
  if (!target.friendRequests.some((request) => sameId(request.from, me._id))) {
    target.friendRequests.push({ from: me._id });
    await target.save();
    await createNotification(
      target._id,
      me._id,
      "friend_request",
      `${me.name} sent you a friend request`,
      `/profile/${me._id}`,
    );
  }
  res.json({ message: "Friend request sent" });
};

export const acceptFriend = async (req, res) => {
  const [me, other] = await Promise.all([
    User.findById(req.user.id),
    User.findById(req.params.id),
  ]);
  if (!other) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }
  if (!me.friendRequests.some((request) => sameId(request.from, other._id))) {
    const e = new Error("Friend request not found");
    e.status = 404;
    throw e;
  }
  me.friendRequests = me.friendRequests.filter((request) => !sameId(request.from, other._id));
  if (!me.friends.some((id) => sameId(id, other._id))) me.friends.push(other._id);
  if (!other.friends.some((id) => sameId(id, me._id))) other.friends.push(me._id);
  await Promise.all([me.save(), other.save()]);
  await createNotification(
    other._id,
    me._id,
    "friend_accept",
    `${me.name} accepted your friend request`,
    `/profile/${me._id}`,
  );
  res.json(await populateProfile(User.findById(me._id)));
};

export const rejectFriend = async (req, res) => {
  const me = await User.findById(req.user.id);
  me.friendRequests = me.friendRequests.filter((request) => !sameId(request.from, req.params.id));
  await me.save();
  res.json(await populateProfile(User.findById(me._id)));
};

export const removeFriend = async (req, res) => {
  if (sameId(req.params.id, req.user.id)) {
    const e = new Error("You cannot unfriend yourself");
    e.status = 400;
    throw e;
  }
  const [me, other] = await Promise.all([
    User.findById(req.user.id),
    User.findById(req.params.id),
  ]);
  if (!other) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }
  if (!me.friends.some((id) => sameId(id, other._id))) {
    const e = new Error("You are not friends");
    e.status = 409;
    throw e;
  }
  me.friends = me.friends.filter((id) => !sameId(id, other._id));
  other.friends = other.friends.filter((id) => !sameId(id, me._id));
  await Promise.all([me.save(), other.save()]);
  res.json(await populateProfile(User.findById(me._id)));
};