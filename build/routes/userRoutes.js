"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = express_1.default.Router();
// General user routes (protected, self-access)
router.get("/profile", authMiddleware_1.protect, userController_1.getUserProfile);
router.put("/profile", authMiddleware_1.protect, userController_1.updateUserProfile);
router.put("/profile/password", authMiddleware_1.protect, userController_1.updateUserPassword);
// Admin-specific routes
router.get("/", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), userController_1.getAllUsers);
exports.default = router;
