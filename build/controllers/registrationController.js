"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRegistration = exports.updateRegistrationStatus = exports.getMyRegistrations = exports.getRegistrationsByEvent = exports.createRegistration = void 0;
const Registration_1 = __importDefault(require("../models/Registration"));
const Event_1 = __importDefault(require("../models/Event"));
const User_1 = __importDefault(require("../models/User"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const cloudinary_1 = require("../config/cloudinary"); // For paymentProofImage uploads
const mongoose_1 = require("mongoose");
const emailService_1 = require("../utils/emailService");
// @desc    Register a student for an event (initial creation)
// @route   POST /api/registrations
// @access  Private (Student only)
const createRegistration = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.user || req.user.role !== "student") {
        return next(new errorHandler_1.default("Only students can register for events.", 403));
    }
    const { eventId } = req.body;
    if (!eventId || !mongoose_1.Types.ObjectId.isValid(eventId)) {
        return next(new errorHandler_1.default("Valid Event ID is required for registration.", 400));
    }
    try {
        const event = yield Event_1.default.findById(eventId);
        if (!event) {
            return next(new errorHandler_1.default("Event not found.", 404));
        }
        // Check if event deadline has passed
        if (new Date() > new Date(event.eventDeadline)) {
            return next(new errorHandler_1.default("Registration for this event has closed.", 400));
        }
        // Check if max attendees limit is reached for 'approved' or 'pending' registrations
        const currentApprovedOrPending = yield Registration_1.default.countDocuments({
            event: eventId,
            status: { $in: ["pending", "approved"] },
        });
        if (currentApprovedOrPending >= event.maxAttendees) {
            return next(new errorHandler_1.default("This event has reached its maximum number of attendees.", 400));
        }
        // Check if user is already registered for this event (pending or approved)
        const existingRegistration = yield Registration_1.default.findOne({
            student: req.user._id,
            event: eventId,
            status: { $in: ["pending", "approved"] },
        });
        if (existingRegistration) {
            return next(new errorHandler_1.default("You are already registered or have a pending registration for this event.", 400));
        }
        let paymentProofImage = "";
        // Handle paymentProofImage upload if event is paid
        if (event.isPaid) {
            if (!req.file) {
                // req.file from uploadSingleImage middleware
                return next(new errorHandler_1.default("Payment proof image is required for paid events.", 400));
            }
            try {
                const result = yield cloudinary_1.cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${(_a = req.file.buffer) === null || _a === void 0 ? void 0 : _a.toString("base64")}`, {
                    folder: "sajiloevents/payment_proofs",
                    resource_type: "image",
                    quality: "auto:low",
                    fetch_format: "auto",
                });
                paymentProofImage = result.secure_url;
            }
            catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return next(new errorHandler_1.default("Error uploading payment proof image. Please try again.", 500));
            }
        }
        else if (req.file) {
            // If event is free, but a file was sent, don't process it and optionally warn/error
            console.warn("Payment proof image uploaded for a free event. Ignoring.");
        }
        const registrationData = Object.assign({ event: eventId, student: req.user._id, status: "pending", registrationDate: new Date() }, (paymentProofImage && { paymentProofImage }));
        const registration = yield Registration_1.default.create(registrationData);
        res.status(201).json({
            success: true,
            message: "Registration created successfully. Awaiting admin approval.",
            registration,
        });
    }
    catch (error) {
        if (error.code === 11000) {
            // Duplicate key error from unique index
            return next(new errorHandler_1.default("You are already registered for this event.", 400));
        }
        next(error);
    }
});
exports.createRegistration = createRegistration;
// @desc    Get all registrations for a specific event (Admin only)
// @route   GET /api/registrations/event/:eventId
// @access  Private (Admin only)
const getRegistrationsByEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only administrators can view event registrations.", 403));
    }
    const { eventId } = req.params;
    if (!mongoose_1.Types.ObjectId.isValid(eventId)) {
        return next(new errorHandler_1.default("Valid Event ID is required.", 400));
    }
    try {
        const eventExists = yield Event_1.default.findById(eventId);
        if (!eventExists) {
            return next(new errorHandler_1.default("Event not found.", 404));
        }
        const registrations = yield Registration_1.default.find({ event: eventId })
            .populate("student", "fullName email") // Populate student details
            .populate("event", "title eventDate isPaid price"); // Populate basic event details
        res.status(200).json({
            success: true,
            count: registrations.length,
            registrations,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getRegistrationsByEvent = getRegistrationsByEvent;
// @desc    Get all registrations for the logged-in student (Student only)
// @route   GET /api/registrations/my-registrations
// @access  Private (Student only)
const getMyRegistrations = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || req.user.role !== "student") {
        return next(new errorHandler_1.default("Please log in as a student to view your registrations.", 403));
    }
    try {
        const registrations = yield Registration_1.default.find({ student: req.user._id })
            .populate("event", "title description eventDate eventTime location isPaid price coverImage") // Populate detailed event info
            .sort({ registrationDate: -1 }); // Sort by most recent registration
        res.status(200).json({
            success: true,
            count: registrations.length,
            registrations,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getMyRegistrations = getMyRegistrations;
// @desc    Admin updates registration status (approve/reject)
// @route   PUT /api/registrations/:id/status
// @access  Private (Admin only)
const updateRegistrationStatus = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only administrators can update registration status.", 403));
    }
    const { status, adminRemarks } = req.body;
    const { id: registrationId } = req.params;
    if (!registrationId || !mongoose_1.Types.ObjectId.isValid(registrationId)) {
        return next(new errorHandler_1.default("Valid Registration ID is required.", 400));
    }
    const validStatuses = ["approved", "rejected"];
    if (!status || !validStatuses.includes(status)) {
        return next(new errorHandler_1.default(`Invalid status provided. Must be one of: ${validStatuses.join(", ")}`, 400));
    }
    try {
        const registration = yield Registration_1.default.findById(registrationId);
        if (!registration) {
            return next(new errorHandler_1.default("Registration not found.", 404));
        }
        // Avoid sending duplicate emails if status is the same
        if (registration.status === status) {
            return res.status(200).json({
                success: true,
                message: `Registration status is already ${status}. No changes made.`,
                registration,
            });
        }
        const event = yield Event_1.default.findById(registration.event);
        // Prevent changing status if event deadline has passed for 'pending' registrations
        if (event &&
            new Date() > new Date(event.eventDeadline) &&
            registration.status === "pending") {
            return next(new errorHandler_1.default("Cannot change status for a pending registration if the event deadline has passed.", 400));
        }
        //  Check max attendees if approving
        if (status === "approved" && event) {
            const currentApproved = yield Registration_1.default.countDocuments({
                event: registration.event,
                status: "approved",
            });
            if (currentApproved >= event.maxAttendees) {
                return next(new errorHandler_1.default("Approving this registration would exceed the maximum attendees for this event.", 400));
            }
        }
        // ✅ Update and Save Registration
        registration.status = status;
        if (adminRemarks !== undefined)
            registration.adminRemarks = adminRemarks;
        yield registration.save();
        // Fetch Student for Email
        const student = yield User_1.default.findById(registration.student);
        if (!student || !event) {
            return res.status(200).json({
                success: true,
                message: `Registration status updated to ${status}. Email not sent (student or event missing).`,
                registration,
            });
        }
        try {
            const info = yield (0, emailService_1.sendRegistrationNotification)(registration, student, event);
            console.log(`✅ Email sent to: ${student.email} & Message ID: ${info.messageId}`);
            return res.status(200).json({
                success: true,
                message: `Registration status updated to ${status}. Email sent successfully.`,
                registration,
            });
        }
        catch (error) {
            console.error(`❌ Email send failed to: ${student.email} & Error:`, error.message);
            return res.status(200).json({
                success: true,
                message: `Registration status updated to ${status}, but email failed to send.`,
                registration,
            });
        }
    }
    catch (error) {
        next(error);
    }
});
exports.updateRegistrationStatus = updateRegistrationStatus;
// @desc    Admin deletes a registration (e.g., fraudulent, or cleanup)
// @route   DELETE /api/registrations/:id
// @access  Private (Admin only)
const deleteRegistration = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only administrators can delete registrations.", 403));
    }
    // Note: A registration might be fraudulent, a duplicate, or the student might have contacted the admin directly to request deletion after approval.
    try {
        const registration = yield Registration_1.default.findById(req.params.id);
        if (!registration) {
            return next(new errorHandler_1.default("Registration not found.", 404));
        }
        // MANDATORY: Delete payment proof image from Cloudinary if it exists
        if (registration.paymentProofImage) {
            const publicId = (_a = registration.paymentProofImage
                .split("/")
                .pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                // Cloudinary public_id for payment proofs are usually in 'folder/id' format,
                // so we need to ensure we get the full path to delete.
                // Assuming public_id is stored directly if created with specific folder.
                // If `public_id` was returned as 'sajiloevents/payment_proofs/xxxx', use that.
                // If it was just 'xxxx', then reconstruct 'sajiloevents/payment_proofs/xxxx'.
                // Let's assume the public_id in the URL is enough to derive it, or store public_id directly in model.
                // For now, let's use the URL's last part, similar to event/post images.
                yield cloudinary_1.cloudinary.uploader.destroy(`sajiloevents/payment_proofs/${publicId}`);
                console.log(`Deleted payment proof image from Cloudinary: ${publicId}`);
            }
        }
        yield registration.deleteOne();
        res.status(200).json({
            success: true,
            message: "Registration deleted successfully.",
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteRegistration = deleteRegistration;
