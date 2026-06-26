import Community from "../models/community.model.js";
const emit = (req, event, payload) => req.app.get("io")?.emit(event, payload);
const escapeRegex = (value) => String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const create = async (req, res) => {
  const item = await Community.create({
    ...req.body,
    creator: req.user.id,
    members: [req.user.id],
  });
  emit(req, "communities:changed", item);
  res.status(201).json(item);
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
  const item = await Community.findById(req.params.id).populate(
    "creator members",
    "name avatar",
  );
  if (!item) {
    const e = new Error("Community not found");
    e.status = 404;
    throw e;
  }
  res.json(item);
};
const membership = (join) => async (req, res) => {
  const item = await Community.findById(req.params.id);
  if (!item) {
    const e = new Error("Community not found");
    e.status = 404;
    throw e;
  }
  item.members = item.members.filter((id) => !id.equals(req.user.id));
  if (join) item.members.push(req.user.id);
  await item.save();
  emit(req, "communities:changed", item);
  res.json({ joined: join, membersCount: item.members.length });
};
export const join = membership(true);
export const leave = membership(false);


