export const notFound = (req, _res, next) => {
  const e = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  e.status = 404;
  next(e);
};
export const errorHandler = (err, _req, res, _next) => {
  const status = err.status || (err.name === "ValidationError" ? 400 : 500);
  res
    .status(status)
    .json({
      message: err.message || "Server error",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};
