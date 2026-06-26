import User from "../models/user.model.js";
import Business from "../models/businessPage.model.js";
import Community from "../models/community.model.js";
import generateToken from "../utils/generateToken.js";

const accountTypes = ["user", "business", "community"];
const emit = (req, event, payload) => req.app.get("io")?.emit(event, payload);

const safe = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  avatar: u.avatar,
  bio: u.bio,
  city: u.city,
  locality: u.locality,
  pincode: u.pincode,
  role: u.role,
});

const sendAuth = (res, user, status = 200) => {
  const token = generateToken(user._id);
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 864e5,
  });
  res.status(status).json({ token, user: safe(user) });
};

export const register = async (req, res) => {
  const {
    name,
    email,
    password,
    city,
    locality,
    pincode,
    accountType = "user",
    businessName,
    businessCategory,
    communityName,
    organizationDescription,
    communityPrivate = false,
  } = req.body;

  if (!name || !email || !password || !city || !locality || !pincode) {
    const e = new Error(
      "Name, email, password, city, locality and pincode are required",
    );
    e.status = 400;
    throw e;
  }
  if (!accountTypes.includes(accountType)) {
    const e = new Error("Account type must be user, business or community");
    e.status = 400;
    throw e;
  }
  if (!/^[1-9][0-9]{5}$/.test(String(pincode).trim())) {
    const e = new Error("Pincode must be a valid 6-digit Indian PIN code");
    e.status = 400;
    throw e;
  }
  if (accountType === "business" && !businessName?.trim()) {
    const e = new Error("Business name is required");
    e.status = 400;
    throw e;
  }
  if (accountType === "community" && !communityName?.trim()) {
    const e = new Error("Community name is required");
    e.status = 400;
    throw e;
  }
  if (await User.exists({ email: email.toLowerCase() })) {
    const e = new Error("Email is already registered");
    e.status = 409;
    throw e;
  }

  let user;
  try {
    user = await User.create({
      name,
      email,
      password,
      city,
      locality,
      pincode: String(pincode).trim(),
      role: accountType,
    });

    if (accountType === "business") {
      const business = await Business.create({
        owner: user._id,
        name: businessName.trim(),
        description: organizationDescription?.trim(),
        category: businessCategory?.trim(),
        city,
        locality,
      });
      emit(req, "business-pages:changed", business);
    }

    if (accountType === "community") {
      const community = await Community.create({
        creator: user._id,
        name: communityName.trim(),
        description: organizationDescription?.trim(),
        city,
        locality,
        isPrivate: Boolean(communityPrivate),
        members: [user._id],
      });
      emit(req, "communities:changed", community);
    }
  } catch (error) {
    if (user) await User.deleteOne({ _id: user._id }).catch(() => {});
    throw error;
  }

  sendAuth(res, user, 201);
};

export const login = async (req, res) => {
  const user = await User.findOne({
    email: req.body.email?.toLowerCase(),
  }).select("+password");
  if (!user || !(await user.comparePassword(req.body.password || ""))) {
    const e = new Error("Invalid email or password");
    e.status = 401;
    throw e;
  }
  sendAuth(res, user);
};

export const logout = (_req, res) =>
  res.clearCookie("token").json({ message: "Logged out" });

export const me = (req, res) => res.json({ user: safe(req.user) });
