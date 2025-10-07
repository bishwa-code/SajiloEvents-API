"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const postController_1 = require("../controllers/postController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware"); // Import multiple image upload middleware
const router = express_1.default.Router();
// Public routes
router.get("/", postController_1.getAllPosts); // Get all posts
router.get("/my", authMiddleware_1.protect, postController_1.getMyPosts); // Get posts created by the logged-in admin
router.get("/:id", postController_1.getPostById); // Get single post by ID
// Admin-only routes (protected and authorized)
router.post("/", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), (0, uploadMiddleware_1.uploadMultipleImages)("images"), postController_1.createPost); // Create post with multiple image upload
router.put("/:id", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), (0, uploadMiddleware_1.uploadMultipleImages)("images"), postController_1.updatePost); // Update post with optional multiple image upload
router.delete("/:id", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), postController_1.deletePost); // Delete post
exports.default = router;
