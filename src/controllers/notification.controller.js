import Notification from "../models/notification.model.js";
export const list = async (req, res) =>
  res.json(
    await Notification.find({ recipient: req.user.id })
      .populate("actor", "name avatar")
      .sort("-createdAt")
      .limit(50),
  );
export const markRead = async (req, res) => {
  const filter = {
    recipient: req.user.id,
    ...(req.params.id && { _id: req.params.id }),
  };
  await Notification.updateMany(filter, { read: true });
  res.json({ message: "Notifications marked read" });
};
