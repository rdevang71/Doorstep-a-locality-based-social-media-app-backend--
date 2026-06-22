import Post from "../models/post.model.js";
export const trending = async (req, res) => {
  const since = new Date(
    Date.now() - Math.min(Number(req.query.days) || 7, 30) * 864e5,
  );
  const match = {
    createdAt: { $gte: since },
    ...(req.query.city && { city: new RegExp(`^${req.query.city}$`, "i") }),
    ...(req.query.pincode && { pincode: String(req.query.pincode).trim() }), ...(req.query.locality && {
      locality: new RegExp(`^${req.query.locality}$`, "i"),
    }),
  };
  const tags = await Post.aggregate([
    { $match: match },
    { $unwind: "$hashtags" },
    { $group: { _id: "$hashtags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: Math.min(Number(req.query.limit) || 10, 30) },
    { $project: { _id: 0, hashtag: "$_id", count: 1 } },
  ]);
  res.json({ hashtags: tags });
};
