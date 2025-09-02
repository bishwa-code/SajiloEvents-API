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
exports.getAllUsers = exports.updateUserPassword = exports.updateUserProfile = exports.getUserProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const Event_1 = __importDefault(require("../models/Event"));
// @desc    Get logged in user's profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return next(new errorHandler_1.default("User not logged in.", 401));
    }
    try {
        // Only return specific, non-sensitive data
        const user = yield User_1.default.findById(req.user._id).select("-password");
        if (!user) {
            return next(new errorHandler_1.default("User not found.", 404));
        }
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getUserProfile = getUserProfile;
// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private (Self-update only)
const updateUserProfile = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return next(new errorHandler_1.default("User not logged in.", 401));
    }
    const { fullName, interests } = req.body;
    try {
        const user = yield User_1.default.findById(req.user._id);
        if (!user) {
            return next(new errorHandler_1.default("User not found.", 404));
        }
        // Admins cannot update their profile this way, their info is tied to event management
        if (user.role === "admin") {
            return next(new errorHandler_1.default("Administrators cannot update their profile details.", 403));
        }
        // Update fullName if provided
        if (fullName)
            user.fullName = fullName;
        // Update interests if all_provided are valid
        if (interests) {
            if (!Array.isArray(interests)) {
                return next(new errorHandler_1.default("Interests must be an array of strings.", 400));
            }
            // --- VALIDATION LOGIC FOR INTERESTS ---
            const validCategories = Event_1.default.schema.path("category").options
                .enum;
            const invalidInterests = interests.filter((interest) => !validCategories.includes(interest));
            if (invalidInterests.length > 0) {
                return next(new errorHandler_1.default(`Invalid interests provided: ${invalidInterests.join(", ")}. Interests must be valid event categories.`, 400));
            }
            user.interests = interests;
        }
        yield user.save();
        // Fetch the updated user data and explicitly exclude the password
        const updatedUser = yield User_1.default.findById(user._id).select("-password");
        res.status(200).json({
            success: true,
            message: "Profile updated successfully!",
            user: updatedUser,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateUserProfile = updateUserProfile;
// @desc    Update user password
// @route   PUT /api/users/profile/password
// @access  Private
const updateUserPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return next(new errorHandler_1.default("User not logged in.", 401));
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return next(new errorHandler_1.default("Please provide both current and new passwords.", 400));
    }
    try {
        const user = yield User_1.default.findById(req.user._id);
        if (!user) {
            return next(new errorHandler_1.default("User not found.", 404));
        }
        // Check if the current password is correct using the method in the User model
        const isMatch = yield user.comparePassword(currentPassword);
        if (!isMatch) {
            return next(new errorHandler_1.default("Incorrect current password.", 401));
        }
        // Update the password
        user.password = newPassword;
        yield user.save(); // Mongoose pre-save hook will hash the new password
        res.status(200).json({
            success: true,
            message: "Password updated successfully!",
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updateUserPassword = updateUserPassword;
// @desc    Get all users (for Admin dashboard)
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only administrators can view all users.", 403));
    }
    try {
        // Find only users with the 'student' role
        const students = yield User_1.default.find({ role: "student" }).select("-password");
        res.status(200).json({
            success: true,
            count: students.length,
            students,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllUsers = getAllUsers;
