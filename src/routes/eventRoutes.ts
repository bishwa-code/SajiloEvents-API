import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController";
import { protect, authorizeRoles } from "../middlewares/authMiddleware";
import { uploadSingleImage } from "../middlewares/uploadMiddleware"; // Import single image upload middleware

const router = express.Router();

// Public routes
router.get("/", getAllEvents); // Get all events
router.get("/:id", getEventById); // Get single event by ID

// Admin-only routes (protected and authorized)
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  uploadSingleImage("coverImage"),
  createEvent
); // Create event with image upload
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  uploadSingleImage("coverImage"),
  updateEvent
); // Update event with optional image upload
router.delete("/:id", protect, authorizeRoles("admin"), deleteEvent); // Delete event

export default router;
