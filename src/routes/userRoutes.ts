import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  getAllUsers,
} from "../controllers/userController";
import { protect, authorizeRoles } from "../middlewares/authMiddleware";

const router = express.Router();

// General user routes (protected, self-access)
router.get("/profile", protect, getUserProfile);
router.put("/profile", protect, updateUserProfile);
router.put("/profile/password", protect, updateUserPassword);

// Admin-specific routes
router.get("/", protect, authorizeRoles("admin"), getAllUsers);

export default router;
