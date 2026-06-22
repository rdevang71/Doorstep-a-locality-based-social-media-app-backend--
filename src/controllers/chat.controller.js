import ChatRoom from "../models/chatRoom.model.js";
import Message from "../models/message.model.js";
export const createRoom = async (req, res) =>
  res
    .status(201)
    .json(
      await ChatRoom.create({
        ...req.body,
        createdBy: req.user.id,
        members: [req.user.id],
      }),
    );
export const listRooms = async (req, res) =>
  res.json(
    await ChatRoom.find(
      req.query.city ? { city: new RegExp(`^${req.query.city}$`, "i") } : {},
    ).sort("-createdAt"),
  );
export const messages = async (req, res) =>
  res.json(
    await Message.find({ room: req.params.id })
      .populate("sender", "name avatar")
      .sort("-createdAt")
      .limit(100)
      .then((v) => v.reverse()),
  );
