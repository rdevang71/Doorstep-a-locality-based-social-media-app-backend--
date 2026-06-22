import Community from "../models/community.model.js";
export const create = async (req, res) =>
  res
    .status(201)
    .json(
      await Community.create({
        ...req.body,
        creator: req.user.id,
        members: [req.user.id],
      }),
    );
export const list = async (req, res) =>
  res.json(
    await Community.find(
      req.query.city ? { city: new RegExp(`^${req.query.city}$`, "i") } : {},
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
  res.json({ joined: join, membersCount: item.members.length });
};
export const join = membership(true);
export const leave = membership(false);
