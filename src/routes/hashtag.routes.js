import { Router } from "express";
import { trending } from "../controllers/hashtag.controller.js";
const r = Router();
r.get("/trending", trending);
export default r;
