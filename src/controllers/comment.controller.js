import mongoose from "mongoose";
import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import createNotification from "../utils/createNotification.js";

const emit = (req, event, payload) => req.app.get("io")?.emit(event, payload);

const findPost = async (postId) => {
  if (!mongoose.isValidObjectId(postId)) {
    const e = new Error("Invalid post ID");
    e.status = 400;
    throw e;
  }
  const post = await Post.findById(postId);
  if (!post) {
    const e = new Error("Post not found");
    e.status = 404;
    throw e;
  }
  return post;
};

export const listComments = async (req, res) => {
  await findPost(req.params.postId);
  const comments = await Comment.find({ post: req.params.postId })
    .populate("author", "name avatar")
    .sort({ createdAt: 1 });
  res.json({ comments });
};

export const createComment = async (req, res) => {
  const content = String(req.body.content || "").trim();
  if (!content) {
    const e = new Error("Comment cannot be empty");
    e.status = 400;
    throw e;
  }
  if (content.length > 1000) {
    const e = new Error("Comment cannot exceed 1000 characters");
    e.status = 400;
    throw e;
  }

  const post = await findPost(req.params.postId);
  let comment;
  try {
    comment = await Comment.create({
      post: post._id,
      author: req.user.id,
      content,
    });
    post.commentsCount += 1;
    await post.save();
  } catch (error) {
    if (comment) await Comment.deleteOne({ _id: comment._id }).catch(() => {});
    throw error;
  }

  await comment.populate("author", "name avatar");
  emit(req, "comments:created", {
    postId: post._id,
    comment,
    commentsCount: post.commentsCount,
  });
  emit(req, "posts:commented", {
    _id: post._id,
    commentsCount: post.commentsCount,
  });
  await createNotification(
    post.author,
    req.user.id,
    "post_comment",
    `${req.user.name} commented on your post`,
    `/posts/${post._id}`,
    { postId: post._id, commentId: comment._id },
  );
  res.status(201).json({ comment, commentsCount: post.commentsCount });
};
