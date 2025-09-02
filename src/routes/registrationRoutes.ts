import express from "express";
import {
  createRegistration,
  getRegistrationsByEvent,
  getMyRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
} from "../controllers/registrationController";
import { protect, authorizeRoles } from "../middlewares/authMiddleware";
import { uploadSingleImage } from "../middlewares/uploadMiddleware"; // For payment proof image

const router = express.Router();

// Student-specific routes
// Registration for event involves potential file upload for payment proof
router.post(
  "/",
  protect,
  uploadSingleImage("paymentProof"),
  createRegistration
);
router.get("/my-registrations", protect, getMyRegistrations); // Get all registrations for the logged-in student

// Admin-specific routes
router.get(
  "/event/:eventId",
  protect,
  authorizeRoles("admin"),
  getRegistrationsByEvent
); // Get all registrations for a specific event
router.put(
  "/:id/status",
  protect,
  authorizeRoles("admin"),
  updateRegistrationStatus
); // Update registration status (approve/reject)
router.delete("/:id", protect, authorizeRoles("admin"), deleteRegistration); // Admin deletes a registration

export default router;
