import ChatRoom from "../models/chatRoom.model.js";
import Community from "../models/community.model.js";
import Message from "../models/message.model.js";

const escapeRegex = (value) =>
  String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const isMember = (community, userId) =>
  community.members.some((id) => String(id?._id || id) === String(userId));

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

export const createRoom = async (req, res) =>
  res.status(201).json(
    await ChatRoom.create({
      ...req.body,
      createdBy: req.user.id,
      members: [req.user.id],
    }),
  );

export const listRooms = async (req, res) =>
  res.json(
    await ChatRoom.find({
      isCommunityRoom: { $ne: true },
      ...(req.query.city && {
        city: new RegExp(`^${escapeRegex(req.query.city)}$`, "i"),
      }),
    }).sort("-createdAt"),
  );

export const communityRoom = async (req, res) => {
  const community = await requireCommunityMember(req.params.id, req.user.id);
  const room = await ChatRoom.findOneAndUpdate(
    { community: community._id, isCommunityRoom: true },
    {
      $setOnInsert: {
        name: `${community.name} chat`,
        city: community.city,
        locality: community.locality,
        community: community._id,
        isCommunityRoom: true,
        createdBy: community.creator,
      },
      $addToSet: { members: req.user.id },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  res.json(room);
};

export const messages = async (req, res) => {
  const room = await ChatRoom.findById(req.params.id);
  if (!room) {
    const e = new Error("Chat room not found");
    e.status = 404;
    throw e;
  }
  if (room.isCommunityRoom) {
    await requireCommunityMember(room.community, req.user.id);
  }

  res.json(
    await Message.find({ room: room._id })
      .populate("sender", "name avatar")
      .sort("-createdAt")
      .limit(100)
      .then((v) => v.reverse()),
  );
};
