import Community from "../models/community.model.js";
const emit = (req, event, payload) => req.app.get("io")?.emit(event, payload);
const escapeRegex = (value) => String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sameId = (a, b) => String(a?._id || a) === String(b?._id || b);
const isMember = (community, userId) => community.members.some((id) => sameId(id, userId));
const hasRequest = (community, userId) =>
  community.joinRequests?.some((request) => sameId(request.user, userId));
const populateCommunity = (query) =>
  query.populate("creator", "name avatar").populate("members", "name avatar").populate("joinRequests.user", "name avatar email");
const requireAdmin = (community, userId) => {
  if (!sameId(community.creator, userId)) {
    const e = new Error("Only the community admin can manage join requests");
    e.status = 403;
    throw e;
  }
};
const findCommunity = async (id) => {
  const item = await Community.findById(id);
  if (!item) {
    const e = new Error("Community not found");
    e.status = 404;
    throw e;
  }
  return item;
};
const sendCommunity = async (req, res, item, status = 200) => {
  const populated = await populateCommunity(Community.findById(item._id));
  emit(req, "communities:changed", populated);
  res.status(status).json(populated);
};

export const create = async (req, res) => {
  const item = await Community.create({
    ...req.body,
    creator: req.user.id,
    members: [req.user.id],
    joinRequests: [],
  });
  await sendCommunity(req, res, item, 201);
};

export const list = async (req, res) =>
  res.json(
    await Community.find(
      req.query.city ? { city: new RegExp(`^${escapeRegex(req.query.city)}$`, "i") } : {},
    )
      .populate("creator", "name avatar")
      .sort("-createdAt"),
  );

export const get = async (req, res) => {
  const item = await populateCommunity(Community.findById(req.params.id));
  if (!item) {
    const e = new Error("Community not found");
    e.status = 404;
    throw e;
  }
  res.json(item);
};

export const requestJoin = async (req, res) => {
  const item = await findCommunity(req.params.id);
  if (isMember(item, req.user.id)) {
    const e = new Error("You are already a member of this community");
    e.status = 409;
    throw e;
  }
  if (hasRequest(item, req.user.id)) {
    const e = new Error("Your join request is already pending");
    e.status = 409;
    throw e;
  }
  item.joinRequests.push({ user: req.user.id });
  await item.save();
  await sendCommunity(req, res, item);
};

export const leave = async (req, res) => {
  const item = await findCommunity(req.params.id);
  if (sameId(item.creator, req.user.id)) {
    const e = new Error("Community admin cannot exit their own community");
    e.status = 400;
    throw e;
  }
  item.members = item.members.filter((id) => !sameId(id, req.user.id));
  item.joinRequests = item.joinRequests.filter((request) => !sameId(request.user, req.user.id));
  await item.save();
  await sendCommunity(req, res, item);
};

export const approveRequest = async (req, res) => {
  const item = await findCommunity(req.params.id);
  requireAdmin(item, req.user.id);
  const requested = hasRequest(item, req.params.userId);
  if (!requested) {
    const e = new Error("Join request not found");
    e.status = 404;
    throw e;
  }
  item.joinRequests = item.joinRequests.filter((request) => !sameId(request.user, req.params.userId));
  if (!isMember(item, req.params.userId)) item.members.push(req.params.userId);
  await item.save();
  await sendCommunity(req, res, item);
};

export const rejectRequest = async (req, res) => {
  const item = await findCommunity(req.params.id);
  requireAdmin(item, req.user.id);
  const requested = hasRequest(item, req.params.userId);
  if (!requested) {
    const e = new Error("Join request not found");
    e.status = 404;
    throw e;
  }
  item.joinRequests = item.joinRequests.filter((request) => !sameId(request.user, req.params.userId));
  await item.save();
  await sendCommunity(req, res, item);
};

export const join = requestJoin;
