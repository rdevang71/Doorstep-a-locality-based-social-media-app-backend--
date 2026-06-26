import Event from "../models/event.model.js";
const emit = (req, event, payload) => req.app.get("io")?.emit(event, payload);
const escapeRegex = (value) => String(value).trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const create = async (req, res) => {
  const item = await Event.create({ ...req.body, organizer: req.user.id });
  emit(req, "events:changed", item);
  res.status(201).json(item);
};
export const list = async (req, res) => {
  const filter = {
    startsAt: { $gte: new Date() },
    ...(req.query.city && { city: new RegExp(`^${escapeRegex(req.query.city)}$`, "i") }),
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
  emit(req, "events:changed", item);
  res.json({ joined: join, attendeesCount: item.attendees.length });
};
export const join = attendance(true);
export const leave = attendance(false);


