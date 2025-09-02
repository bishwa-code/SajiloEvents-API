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
exports.deletePost = exports.updatePost = exports.getPostById = exports.getAllPosts = exports.createPost = void 0;
const Post_1 = __importDefault(require("../models/Post"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const cloudinary_1 = require("../config/cloudinary"); // Import cloudinary instance
const mongoose_1 = require("mongoose"); // For ObjectId type checking
// @desc    Create a new post
// @route   POST /api/posts
// @access  Private (Admin only)
const createPost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only administrators can create posts.", 403));
    }
    const { title, content, category, event: eventId } = req.body;
    if (!title || !content) {
        return next(new errorHandler_1.default("Post title and content are required.", 400));
    }
    const validCategories = ["Notice", "Announcement", "General"];
    const postCategory = category && validCategories.includes(category) ? category : "General";
    const images = [];
    // Upload multiple images to Cloudinary
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        try {
            for (const file of req.files) {
                const result = yield cloudinary_1.cloudinary.uploader.upload(`data:${file.mimetype};base64,${(_a = file.buffer) === null || _a === void 0 ? void 0 : _a.toString("base64")}`, {
                    folder: "sajiloevents/post_images",
                    resource_type: "image",
                    quality: "auto:low",
                    fetch_format: "auto",
                });
                images.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                });
            }
        }
        catch (uploadError) {
            console.error("Cloudinary upload error:", uploadError);
            return next(new errorHandler_1.default("Error uploading post images. Please try again.", 500));
        }
    }
    try {
        const postData = {
            title,
            content,
            category: postCategory,
            images,
            author: req.user._id,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        if (eventId && mongoose_1.Types.ObjectId.isValid(eventId)) {
            postData.event = mongoose_1.Types.ObjectId.createFromHexString(eventId);
        }
        const post = yield Post_1.default.create(postData);
        res.status(201).json({
            success: true,
            message: "Post created successfully!",
            post,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.createPost = createPost;
// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getAllPosts = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const posts = yield Post_1.default.find()
            .populate("author", "fullName email") // Populate author details
            .populate("event", "title eventDate location"); // Populate related event details
        res.status(200).json({
            success: true,
            count: posts.length,
            posts,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getAllPosts = getAllPosts;
// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const post = yield Post_1.default.findById(req.params.id)
            .populate("author", "fullName email")
            .populate("event", "title eventDate location");
        if (!post) {
            return next(new errorHandler_1.default("Post not found.", 404));
        }
        res.status(200).json({
            success: true,
            post,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.getPostById = getPostById;
// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (Admin only, owner only)
const updatePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only administrators can update posts.", 403));
    }
    try {
        let post = yield Post_1.default.findById(req.params.id);
        if (!post) {
            return next(new errorHandler_1.default("Post not found.", 404));
        }
        // STRICT OWNERSHIP CHECK: Only the author can update the post
        if (post.author.toString() !== req.user.id.toString()) {
            return next(new errorHandler_1.default("You are not authorized to update this post. Only the post author can.", 403));
        }
        // Validate and prepare category update if provided
        const validCategories = ["Notice", "Announcement", "General"];
        let categoryToUpdate = post.category;
        if (req.body.category !== undefined) {
            if (validCategories.includes(req.body.category)) {
                categoryToUpdate = req.body.category;
            }
            else {
                return next(new errorHandler_1.default("Invalid category provided.", 400));
            }
        }
        // Prepare update data for fields that are being SET
        const setUpdate = {
            title: req.body.title || post.title,
            content: req.body.content || post.content,
            category: categoryToUpdate,
            updatedAt: new Date(),
        };
        // Handle optional event ID update
        if (req.body.event !== undefined) {
            // Check if event field is sent in request
            if (req.body.event && mongoose_1.Types.ObjectId.isValid(req.body.event)) {
                setUpdate.event = mongoose_1.Types.ObjectId.createFromHexString(req.body.event);
            }
            else if (req.body.event === "") {
                // If client sends empty string to clear event
                delete setUpdate.event; // Remove from $set to avoid setting null/empty string
                post.$unset("event"); // Use $unset directly on the document (preferred for removal)
            }
            else {
                return next(new errorHandler_1.default("Invalid event ID provided for post.", 400));
            }
        }
        // Handle image updates
        let newImages = post.images || [];
        // If new files are uploaded, first delete old ones then upload new ones
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            // MANDATORY: Delete existing images from Cloudinary
            for (const image of newImages) {
                yield cloudinary_1.cloudinary.uploader.destroy(image.public_id);
                console.log(`Deleted old post image from Cloudinary: ${image.public_id}`);
            }
            newImages = []; // Clear array for new uploads
            // Upload new images
            for (const file of req.files) {
                const result = yield cloudinary_1.cloudinary.uploader.upload(`data:${file.mimetype};base64,${(_a = file.buffer) === null || _a === void 0 ? void 0 : _a.toString("base64")}`, {
                    folder: "sajiloevents/post_images",
                    resource_type: "image",
                    quality: "auto:low",
                    fetch_format: "auto",
                });
                newImages.push({
                    public_id: result.public_id,
                    url: result.secure_url,
                });
            }
            setUpdate.images = newImages; // Assign the new image array
        }
        else if (req.body.clearImages === "true" &&
            post.images &&
            post.images.length > 0) {
            // If no new files but clearImages flag is true, delete all existing images
            for (const image of newImages) {
                yield cloudinary_1.cloudinary.uploader.destroy(image.public_id);
                console.log(`Deleted all post images from Cloudinary: ${image.public_id}`);
            }
            setUpdate.images = []; // Set images array to empty
        }
        // Find and update the post
        // Use the direct update method for mixed $set and $unset
        const updatedPost = yield Post_1.default.findByIdAndUpdate(req.params.id, { $set: setUpdate }, // Use $set for all properties in setUpdate
        { new: true, runValidators: true })
            .populate("author", "fullName email")
            .populate("event", "title eventDate location");
        if (!updatedPost) {
            return next(new errorHandler_1.default("Failed to update post.", 500));
        }
        res.status(200).json({
            success: true,
            message: "Post updated successfully!",
            post: updatedPost,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.updatePost = updatePost;
// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Admin only, owner only)
const deletePost = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user || req.user.role !== "admin") {
        return next(new errorHandler_1.default("Only administrators can delete posts.", 403));
    }
    try {
        const post = yield Post_1.default.findById(req.params.id);
        if (!post) {
            return next(new errorHandler_1.default("Post not found.", 404));
        }
        // STRICT OWNERSHIP CHECK: Only the author can delete the post
        if (post.author.toString() !== req.user.id.toString()) {
            return next(new errorHandler_1.default("You are not authorized to delete this post. Only the post author can.", 403));
        }
        // MANDATORY: Delete all associated images from Cloudinary
        if (post.images && post.images.length > 0) {
            for (const image of post.images) {
                yield cloudinary_1.cloudinary.uploader.destroy(image.public_id);
                console.log(`Deleted post image from Cloudinary on post deletion: ${image.public_id}`);
            }
        }
        yield post.deleteOne();
        res.status(200).json({
            success: true,
            message: "Post deleted successfully!",
        });
    }
    catch (error) {
        next(error);
    }
});
exports.deletePost = deletePost;
