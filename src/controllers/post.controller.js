import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import normalizeHashtags from "../utils/normalizeHashtags.js";
import cloudinary from "../config/cloudinary.js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const saveImagesLocally = async (files, req) => {
  const directory = path.resolve("uploads", "posts");
  await mkdir(directory, { recursive: true });
  const baseUrl = req.protocol + "://" + req.get("host");

  return Promise.all(
    files.map(async (file) => {
      const filename = randomUUID() + imageExtensions[file.mimetype];
      await writeFile(path.join(directory, filename), file.buffer);
      return baseUrl + "/uploads/posts/" + filename;
    }),
  );
};

const uploadImages = (files = [], req) => {
  if (process.env.NODE_ENV !== "production") {
    return saveImagesLocally(files, req);
  }

  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "localconnect/posts",
              resource_type: "image",
              transformation: [
                {
                  width: 1600,
                  height: 1600,
                  crop: "limit",
                  quality: "auto",
                  fetch_format: "auto",
                },
              ],
            },
            (error, result) => {
              if (error) {
                error.status = 502;
                error.message = "Image upload failed: " + error.message;
                reject(error);
                return;
              }
              resolve(result.secure_url);
            },
          );
          stream.end(file.buffer);
        }),
    ),
  );
};
const owned = async (id, user) => {
  const post = await Post.findById(id);
  if (!post) {
    const e = new Error("Post not found");
    e.status = 404;
    throw e;
  }
  if (
    post.author.toString() !== user.id.toString() &&
    !["admin", "moderator"].includes(user.role)
  ) {
    const e = new Error("You cannot modify this post");
    e.status = 403;
    throw e;
  }
  return post;
};
export const createPost = async (req, res) => {
  const { content, type, city, locality, pincode, hashtags, images } = req.body;
  const suppliedImages = Array.isArray(images)
    ? images
    : images
      ? [images]
      : [];
  const uploadedImages = req.files?.length ? await uploadImages(req.files, req) : [];
  const post = await Post.create({
    author: req.user.id,
    content,
    type,
    city: city || req.user.city,
    locality: locality || req.user.locality,
    pincode: pincode || req.user.pincode,
    hashtags: normalizeHashtags(hashtags),
    images: [...suppliedImages, ...uploadedImages],
  });
  res
    .status(201)
    .json(await post.populate("author", "name avatar city locality pincode"));
};
export const listPosts = async (req, res) => {
  const {
    city,
    locality,
    pincode,
    hashtag,
    type,
    sort = "recent",
    page = 1,
    limit = 20,
  } = req.query;
  const filter = {
    ...(city && {
      city: new RegExp(
        `^${String(city).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    }),
    ...(pincode && { pincode: String(pincode).trim() }),
    ...(locality && {
      locality: new RegExp(
        `^${String(locality).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    }),
    ...(hashtag && { hashtags: normalizeHashtags([hashtag])[0] }),
    ...(type && { type }),
  };
  const take = Math.min(Number(limit) || 20, 50);
  const [posts, total] = await Promise.all([
    Post.find(filter)
      .populate("author", "name avatar city locality pincode")
      .sort(
        sort === "popular"
          ? { commentsCount: -1, createdAt: -1 }
          : { createdAt: -1 },
      )
      .skip((Math.max(Number(page), 1) - 1) * take)
      .limit(take),
    Post.countDocuments(filter),
  ]);
  res.json({
    posts,
    pagination: {
      page: Number(page),
      limit: take,
      total,
      pages: Math.ceil(total / take),
    },
  });
};
export const getPost = async (req, res) => {
  const post = await Post.findById(req.params.id).populate(
    "author",
    "name avatar city locality pincode",
  );
  if (!post) {
    const e = new Error("Post not found");
    e.status = 404;
    throw e;
  }
  res.json(post);
};
export const updatePost = async (req, res) => {
  const post = await owned(req.params.id, req.user);
  ["content", "type", "city", "locality", "images"].forEach(
    (k) => req.body[k] !== undefined && (post[k] = req.body[k]),
  );
  if (req.body.hashtags !== undefined)
    post.hashtags = normalizeHashtags(req.body.hashtags);
  await post.save();
  res.json(await post.populate("author", "name avatar city locality pincode"));
};
export const deletePost = async (req, res) => {
  const post = await owned(req.params.id, req.user);
  await Promise.all([
    post.deleteOne(),
    Comment.deleteMany({ post: post._id }),
  ]);
  res.json({ message: "Post deleted" });
};
export const toggleLike = async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    const e = new Error("Post not found");
    e.status = 404;
    throw e;
  }
  const index = post.likes.findIndex(
    (id) => id.toString() === req.user.id.toString(),
  );
  index >= 0 ? post.likes.splice(index, 1) : post.likes.push(req.user.id);
  await post.save();
  res.json({ liked: index < 0, likesCount: post.likes.length });
};
