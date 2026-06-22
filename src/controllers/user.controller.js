import User from "../models/user.model.js";
export const getProfile = async (req, res) => {
  const user = await User.findById(req.params.id || req.user.id).select(
    "-password",
  );
  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }
  res.json(user);
};
export const updateMe = async (req, res) => {
  const allowed = ["name", "bio", "avatar", "city", "locality", "pincode"];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k)),
  );
  res.json(
    await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password"),
  );
};
