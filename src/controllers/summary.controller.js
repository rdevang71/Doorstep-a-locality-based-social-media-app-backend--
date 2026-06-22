import Post from "../models/post.model.js";
import { summarizePosts } from "../utils/aiSummary.js";
const ranges = { "24h": 24, "7d": 168, "30d": 720 };
export const areaSummary = async (req, res) => {
  const { city, locality, timeRange = "24h" } = req.body;
  if (!city) {
    const e = new Error("City is required");
    e.status = 400;
    throw e;
  }
  const since = new Date(Date.now() - (ranges[timeRange] || 24) * 36e5);
  const filter = {
    city: new RegExp(`^${city}$`, "i"),
    ...(locality && { locality: new RegExp(`^${locality}$`, "i") }),
    createdAt: { $gte: since },
  };
  const posts = await Post.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  const counts = posts
    .flatMap((p) => p.hashtags)
    .reduce((a, t) => ({ ...a, [t]: (a[t] || 0) + 1 }), {});
  const tags = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([hashtag, count]) => ({ hashtag, count }));
  res.json(
    await summarizePosts(
      posts,
      locality ? `${city} - ${locality}` : city,
      tags,
    ),
  );
};
