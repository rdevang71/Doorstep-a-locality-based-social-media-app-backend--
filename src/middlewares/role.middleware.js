export const allowRoles =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      const e = new Error("Insufficient permissions");
      e.status = 403;
      throw e;
    }
    next();
  };
