import express from "express";
import { getRecommendedEvents } from "../controllers/recommendationController";
import { protect } from "../middlewares/authMiddleware";

const router = express.Router();

router.get("/", protect, getRecommendedEvents);

export default router;
