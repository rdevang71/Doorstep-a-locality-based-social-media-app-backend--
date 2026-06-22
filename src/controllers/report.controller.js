import Report from "../models/report.model.js";
export const create = async (req, res) =>
  res
    .status(201)
    .json(await Report.create({ ...req.body, reporter: req.user.id }));
export const list = async (req, res) =>
  res.json(
    await Report.find(req.query.status ? { status: req.query.status } : {})
      .populate("reporter", "name email")
      .sort("-createdAt"),
  );
export const update = async (req, res) =>
  res.json(
    await Report.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status, moderatorNote: req.body.moderatorNote },
      { new: true, runValidators: true },
    ),
  );
