import express from "express";
import {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/postController";
import { protect, authorizeRoles } from "../middlewares/authMiddleware";
import { uploadMultipleImages } from "../middlewares/uploadMiddleware"; // Import multiple image upload middleware

const router = express.Router();

// Public routes
router.get("/", getAllPosts); // Get all posts
router.get("/:id", getPostById); // Get single post by ID

// Admin-only routes (protected and authorized)
router.post(
  "/",
  protect,
  authorizeRoles("admin"),
  uploadMultipleImages("images"),
  createPost
); // Create post with multiple image upload
router.put(
  "/:id",
  protect,
  authorizeRoles("admin"),
  uploadMultipleImages("images"),
  updatePost
); // Update post with optional multiple image upload
router.delete("/:id", protect, authorizeRoles("admin"), deletePost); // Delete post

export default router;
