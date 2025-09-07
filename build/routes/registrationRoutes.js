"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const registrationController_1 = require("../controllers/registrationController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware"); // For payment proof image
const router = express_1.default.Router();
// Student-specific routes
// Registration for event involves potential file upload for payment proof
router.post("/", authMiddleware_1.protect, (0, uploadMiddleware_1.uploadSingleImage)("paymentProof"), registrationController_1.createRegistration);
router.get("/my-registrations", authMiddleware_1.protect, registrationController_1.getMyRegistrations); // Get all registrations for the logged-in student
// Admin-specific routes
router.get("/event/:eventId", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), registrationController_1.getRegistrationsByEvent); // Get all registrations for a specific event
router.put("/:id/status", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), registrationController_1.updateRegistrationStatus); // Update registration status (approve/reject)
router.delete("/:id", authMiddleware_1.protect, (0, authMiddleware_1.authorizeRoles)("admin"), registrationController_1.deleteRegistration); // Admin deletes a registration
exports.default = router;
