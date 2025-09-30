"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventController_1 = require("../controllers/eventController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware"); // Import single image upload middleware
const router = express_1.default.Router();
// Public routes
router.get("/", eventController_1.getAllEvents); // Get all events
router.get("/:id", eventController_1.getEventById); // Get single event by ID
// Admin-only routes (protected and authorized)
router.get("/events", authMiddleware_1.protect, eventController_1.getMyEvents); // Get events created by the logged-in admin
router.post("/", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), (0, uploadMiddleware_1.uploadSingleImage)("coverImage"), eventController_1.createEvent); // Create event with image upload
router.put("/:id", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), (0, uploadMiddleware_1.uploadSingleImage)("coverImage"), eventController_1.updateEvent); // Update event with optional image upload
router.delete("/:id", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), eventController_1.deleteEvent); // Delete event
exports.default = router;
