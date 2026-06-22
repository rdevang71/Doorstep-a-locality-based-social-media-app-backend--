import OpenAI from "openai";
export async function summarizePosts(posts, area, trendingHashtags) {
  const empty = {
    area,
    totalPostsAnalyzed: posts.length,
    highlights: [],
    events: [],
    businessOffers: [],
    serviceNeeds: [],
    trendingTopics: [],
    trendingHashtags,
  };
  if (!posts.length) return empty;
  if (!process.env.AI_API_KEY) {
    return {
      ...empty,
      highlights: posts.slice(0, 5).map((p) => p.content),
      events: posts.filter((p) => p.type === "event").map((p) => p.content),
      businessOffers: posts
        .filter((p) => p.type === "offer")
        .map((p) => p.content),
      serviceNeeds: posts
        .filter((p) => p.type === "need")
        .map((p) => p.content),
      trendingTopics: trendingHashtags.slice(0, 5),
    };
  }
  const client = new OpenAI({ apiKey: process.env.AI_API_KEY });
  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL || "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "Summarize local posts. Return JSON only with arrays: highlights, events, businessOffers, serviceNeeds, trendingTopics. Never invent facts.",
      },
      {
        role: "user",
        content: JSON.stringify({
          area,
          posts: posts.map(({ content, type, hashtags, createdAt }) => ({
            content,
            type,
            hashtags,
            createdAt,
          })),
        }),
      },
    ],
  });
  const parsed = JSON.parse(response.choices[0].message.content);
  return {
    ...empty,
    ...parsed,
    area,
    totalPostsAnalyzed: posts.length,
    trendingHashtags,
  };
}
