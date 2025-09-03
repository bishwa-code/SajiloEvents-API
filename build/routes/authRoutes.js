"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
router.post("/register", authController_1.registerStudent); // Student registration
router.post("/login", authController_1.loginUser); // Student and Admin login
router.get("/logout", authController_1.logoutUser); // Logout
router.get("/me", authMiddleware_1.protect, authController_1.getMe); // Get current user details, requires authentication
// Admin registration endpoint
// Initially, this endpoint allows creation if no admins exist.
// After the first admin is created, only existing admins can use it (if protect is applied).
// This offers flexibility for initial setup.
router.post("/admin-register", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), authController_1.registerAdmin);
// If we want to strictly enforce that only logged-in admins can create other admins:
// router.post('/admin-register', protect, authorizeRoles('admin'), registerAdmin);
// But for the very first admin, you would need to temporarily remove `protect` and `authorizeRoles`
// The current `registerAdmin` controller logic tries to handle the "first admin" case gracefully.
exports.default = router;
