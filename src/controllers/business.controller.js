import Business from "../models/businessPage.model.js";
const emit = (req, event, payload) => req.app.get("io")?.emit(event, payload);
const escapeRegex = (value) => String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const create = async (req, res) => {
  const item = await Business.create({ ...req.body, owner: req.user.id });
  emit(req, "business-pages:changed", item);
  res.status(201).json(item);
};
export const list = async (req, res) =>
  res.json(
    await Business.find(
      req.query.city ? { city: new RegExp(`^${escapeRegex(req.query.city)}$`, "i") } : {},
    )
      .populate("owner", "name avatar")
      .sort("-createdAt"),
  );
export const get = async (req, res) => {
  const item = await Business.findById(req.params.id).populate(
    "owner",
    "name avatar",
  );
  if (!item) {
    const e = new Error("Business page not found");
    e.status = 404;
    throw e;
  }
  res.json(item);
};
export const update = async (req, res) => {
  const item = await Business.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    req.body,
    { new: true, runValidators: true },
  );
  if (!item) {
    const e = new Error("Business page not found or not yours");
    e.status = 404;
    throw e;
  }
  emit(req, "business-pages:changed", item);
  res.json(item);
};
export const remove = async (req, res) => {
  const item = await Business.findOneAndDelete({
    _id: req.params.id,
    owner: req.user.id,
  });
  if (!item) {
    const e = new Error("Business page not found or not yours");
    e.status = 404;
    throw e;
  }
  emit(req, "business-pages:changed", item);
  res.json({ message: "Business page deleted" });
};
export const follow = async (req, res) => {
  const item = await Business.findById(req.params.id);
  if (!item) {
    const e = new Error("Business page not found");
    e.status = 404;
    throw e;
  }
  const i = item.followers.findIndex((id) => id.equals(req.user.id));
  i >= 0 ? item.followers.splice(i, 1) : item.followers.push(req.user.id);
  await item.save();
  emit(req, "business-pages:changed", item);
  res.json({ following: i < 0, followersCount: item.followers.length });
};



