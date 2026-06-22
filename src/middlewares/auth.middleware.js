import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
export const protect = async (req, _res, next) => {
  const token =
    req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    const e = new Error("Authentication required");
    e.status = 401;
    throw e;
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id).select("-password");
  if (!req.user) {
    const e = new Error("User no longer exists");
    e.status = 401;
    throw e;
  }
  next();
};
