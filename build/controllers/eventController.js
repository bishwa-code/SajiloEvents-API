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
exports.deleteEvent = exports.updateEvent = exports.getEventById = exports.getMyEvents = exports.getAllEvents = exports.createEvent = void 0;
const Event_1 = __importDefault(require("../models/Event"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const cloudinary_1 = require("../config/cloudinary"); // Import cloudinary instance
// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Admin only)
const createEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only administrators can create events.", 403));
    }
    const { title, description, category, eventDate, eventTime, location, maxAttendees, eventDeadline, isPaid, price, } = req.body;
    if (!title ||
        !description ||
        !category ||
        !eventDate ||
        !eventTime ||
        !location ||
        !maxAttendees ||
        !eventDeadline) {
        return next(new errorHandler_1.default("Please fill all required event fields.", 400));
    }
    if (isNaN(new Date(eventDate).getTime())) {
        return next(new errorHandler_1.default("Invalid event date format.", 400));
    }
    if (isNaN(new Date(eventDeadline).getTime())) {
        return next(new errorHandler_1.default("Invalid event deadline format.", 400));
    }
    if (new Date(eventDeadline) > new Date(eventDate)) {
        return next(new errorHandler_1.default("Event deadline cannot be after the event date.", 400));
    }
    if (new Date(eventDate) < new Date()) {
        return next(new errorHandler_1.default("Event date cannot be in the past.", 400));
    }
    if (maxAttendees <= 0) {
        return next(new errorHandler_1.default("Maximum attendees must be a positive number.", 400));
    }
    // Convert isPaid from string to boolean for validation
    const isPaidBoolean = isPaid === "true";
    if (isPaidBoolean &&
        (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
        return next(new errorHandler_1.default("Price is required and must be a non-negative number for paid events.", 400));
    }
    let coverImage = "";
    if (req.file) {
        try {
            const result = yield cloudinary_1.cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${(_a = req.file.buffer) === null || _a === void 0 ? void 0 : _a.toString("base64")}`, {
                folder: "sajiloevents/event_covers",
                resource_type: "image",
                quality: "auto:low",
                fetch_format: "auto",
            });
            coverImage = result.secure_url;
        }
        catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
            return next(new errorHandler_1.default("Error uploading event cover image. Please try again.", 500));
        }
    }
    try {
        const event = yield Event_1.default.create({
            title,
            description,
            category,
            eventDate,
            eventTime,
            location,
            organizer: req.user._id,
            maxAttendees,
            eventDeadline,
            isPaid: isPaidBoolean,
            price: isPaidBoolean ? parseFloat(price) : undefined,
            coverImage,
        });
        res.status(201).json({
            success: true,
            message: "Event created successfully!",
            event,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createEvent = createEvent;
// @desc    Get all events (for students and public view)
// @route   GET /api/events
// @access  Public
const getAllEvents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const events = yield Event_1.default.find().populate("organizer", "fullName email");
        res.status(200).json({
            success: true,
            count: events.length,
            events,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllEvents = getAllEvents;
// @desc    Get events created by the logged-in admin
// @route   GET /api/admin/events
// @access  Private (Admin only)
const getMyEvents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only admins can access this resource.", 403));
    }
    try {
        // Fetch events created by this admin
        const events = yield Event_1.default.find({ organizer: req.user._id }).populate("organizer", "fullName email");
        res.status(200).json({
            success: true,
            count: events.length,
            events,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getMyEvents = getMyEvents;
// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const event = yield Event_1.default.findById(req.params.id).populate("organizer", "fullName email");
        if (!event) {
            return next(new errorHandler_1.default("Event not found.", 404));
        }
        res.status(200).json({
            success: true,
            event,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getEventById = getEventById;
// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Admin only, owner only)
const updateEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only administrators can update events.", 403));
    }
    try {
        let event = yield Event_1.default.findById(req.params.id);
        if (!event) {
            return next(new errorHandler_1.default("Event not found.", 404));
        }
        // STRICT OWNERSHIP CHECK: Only the organizer can update the event
        if (event.organizer.toString() !== req.user.id.toString()) {
            return next(new errorHandler_1.default("You are not authorized to update this event. Only the event organizer can.", 403));
        }
        let coverImage = event.coverImage; // Keep existing image by default
        // If a new file is uploaded, upload to Cloudinary and update the URL
        if (req.file) {
            // MANDATORY: Delete old image from Cloudinary if it exists
            if (event.coverImage) {
                const publicId = (_a = event.coverImage.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
                if (publicId) {
                    yield cloudinary_1.cloudinary.uploader.destroy(`sajiloevents/event_covers/${publicId}`);
                    console.log(`Deleted old image from Cloudinary: ${publicId}`); // Log for debugging
                }
            }
            const result = yield cloudinary_1.cloudinary.uploader.upload(`data:${req.file.mimetype};base64,${(_b = req.file.buffer) === null || _b === void 0 ? void 0 : _b.toString("base64")}`, {
                folder: "sajiloevents/event_covers",
                resource_type: "image",
                quality: "auto:low",
                fetch_format: "auto",
            });
            coverImage = result.secure_url;
        }
        // Prepare update data for fields that are being SET
        const setUpdate = {
            title: req.body.title,
            description: req.body.description,
            category: req.body.category,
            eventDate: req.body.eventDate,
            eventTime: req.body.eventTime,
            location: req.body.location,
            maxAttendees: req.body.maxAttendees,
            eventDeadline: req.body.eventDeadline,
            isPaid: req.body.isPaid === "true", // Convert string 'true'/'false' to boolean
            coverImage, // Set the cover image (new or old)
        };
        const isPaidBoolean = setUpdate.isPaid;
        const newPrice = parseFloat(req.body.price);
        // Prepare an object for fields that need to be UNSET (removed)
        const unsetUpdate = {};
        if (isPaidBoolean) {
            // If client sends isPaid=true but forgets to include price
            // If event is paid, ensure price is a valid number and set it
            if (isNaN(newPrice) || newPrice < 0) {
                return next(new errorHandler_1.default("Price must be a non-negative number for paid events.", 400));
            }
            setUpdate.price = newPrice;
        }
        else {
            // If event is free, ensure price is explicitly unset
            unsetUpdate.price = ""; // Value doesn't matter for $unset
        }
        // Combine updates: first set existing fields, then unset specific fields if needed
        const updateOperators = { $set: setUpdate };
        if (Object.keys(unsetUpdate).length > 0) {
            updateOperators.$unset = unsetUpdate;
        }
        console.log("Update Operators:", updateOperators);
        event = yield Event_1.default.findByIdAndUpdate(req.params.id, updateOperators, {
            new: true,
            runValidators: true,
        }).populate("organizer", "fullName email");
        res.status(200).json({
            success: true,
            message: "Event updated successfully!",
            event,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateEvent = updateEvent;
// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Admin only, owner only)
const deleteEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only administrators can delete events.", 403));
    }
    try {
        const event = yield Event_1.default.findById(req.params.id);
        if (!event) {
            return next(new errorHandler_1.default("Event not found.", 404));
        }
        // STRICT OWNERSHIP CHECK: Only the organizer can delete the event
        if (event.organizer.toString() !== req.user.id.toString()) {
            return next(new errorHandler_1.default("You are not authorized to delete this event. Only the event organizer can.", 403));
        }
        // MANDATORY: Delete image from Cloudinary if it exists
        if (event.coverImage) {
            const publicId = (_a = event.coverImage.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
            if (publicId) {
                yield cloudinary_1.cloudinary.uploader.destroy(`sajiloevents/event_covers/${publicId}`);
                console.log(`Deleted image from Cloudinary on event deletion: ${publicId}`); // Log for debugging
            }
        }
        yield event.deleteOne();
        res.status(200).json({
            success: true,
            message: "Event deleted successfully!",
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deleteEvent = deleteEvent;
