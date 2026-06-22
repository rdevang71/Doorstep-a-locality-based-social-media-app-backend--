import Event from "../models/event.model.js";
export const create = async (req, res) =>
  res
    .status(201)
    .json(await Event.create({ ...req.body, organizer: req.user.id }));
export const list = async (req, res) => {
  const filter = {
    startsAt: { $gte: new Date() },
    ...(req.query.city && { city: new RegExp(`^${req.query.city}$`, "i") }),
  };
  res.json(
    await Event.find(filter)
      .populate("organizer", "name avatar")
      .sort("startsAt"),
  );
};
export const get = async (req, res) => {
  const item = await Event.findById(req.params.id).populate(
    "organizer attendees",
    "name avatar",
  );
  if (!item) {
    const e = new Error("Event not found");
    e.status = 404;
    throw e;
  }
  res.json(item);
};
const attendance = (join) => async (req, res) => {
  const item = await Event.findById(req.params.id);
  if (!item) {
    const e = new Error("Event not found");
    e.status = 404;
    throw e;
  }
  item.attendees = item.attendees.filter((id) => !id.equals(req.user.id));
  if (join) item.attendees.push(req.user.id);
  await item.save();
  res.json({ joined: join, attendeesCount: item.attendees.length });
};
export const join = attendance(true);
export const leave = attendance(false);
