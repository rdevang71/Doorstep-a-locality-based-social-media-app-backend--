import Report from "../models/report.model.js";
const emit = (req, event, payload) => req.app.get("io")?.emit(event, payload);
export const create = async (req, res) => {
  const item = await Report.create({ ...req.body, reporter: req.user.id });
  emit(req, "reports:changed", item);
  res.status(201).json(item);
};
export const list = async (req, res) =>
  res.json(
    await Report.find(req.query.status ? { status: req.query.status } : {})
      .populate("reporter", "name email")
      .sort("-createdAt"),
  );
export const update = async (req, res) => {
  const item = await Report.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, moderatorNote: req.body.moderatorNote },
    { new: true, runValidators: true },
  );
  emit(req, "reports:changed", item);
  res.json(item);
};

