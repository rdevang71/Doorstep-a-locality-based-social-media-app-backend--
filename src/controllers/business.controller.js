import Business from "../models/businessPage.model.js";
export const create = async (req, res) =>
  res
    .status(201)
    .json(await Business.create({ ...req.body, owner: req.user.id }));
export const list = async (req, res) =>
  res.json(
    await Business.find(
      req.query.city ? { city: new RegExp(`^${req.query.city}$`, "i") } : {},
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
  res.json({ following: i < 0, followersCount: item.followers.length });
};
