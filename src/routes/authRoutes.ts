import express from "express";
import {
  registerStudent,
  loginUser,
  logoutUser,
  getMe,
  registerAdmin,
} from "../controllers/authController";
import { protect, authorizeRoles } from "../middlewares/authMiddleware";

const router = express.Router();

router.post("/register", registerStudent); // Student registration
router.post("/login", loginUser); // Student and Admin login
router.get("/logout", logoutUser); // Logout
router.get("/me", protect, getMe); // Get current user details, requires authentication

// Admin registration endpoint
// Initially, this endpoint allows creation if no admins exist.
// After the first admin is created, only existing admins can use it (if protect is applied).
// This offers flexibility for initial setup.
router.post("/admin-register", protect, authorizeRoles("admin"), registerAdmin);

// If we want to strictly enforce that only logged-in admins can create other admins:
// router.post('/admin-register', protect, authorizeRoles('admin'), registerAdmin);
// But for the very first admin, you would need to temporarily remove `protect` and `authorizeRoles`
// The current `registerAdmin` controller logic tries to handle the "first admin" case gracefully.

export default router;
