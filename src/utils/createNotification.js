import Notification from "../models/notification.model.js";
export default async (recipient, actor, type, message, link = "") =>
  recipient?.toString() === actor?.toString()
    ? null
    : Notification.create({ recipient, actor, type, message, link });
