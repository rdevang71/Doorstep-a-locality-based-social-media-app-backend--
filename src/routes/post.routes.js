import { Router } from "express";
import * as c from "../controllers/post.controller.js";
import * as comments from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";
const r = Router();
r.route("/")
  .post(protect, upload.array("images", 4), c.createPost)
  .get(c.listPosts);
r.put("/:id/like", protect, c.toggleLike);
r.route("/:postId/comments")
  .get(comments.listComments)
  .post(protect, comments.createComment);
r.route("/:id")
  .get(c.getPost)
  .put(protect, c.updatePost)
  .delete(protect, c.deletePost);
export default r;
