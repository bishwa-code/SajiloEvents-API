import { Request, Response, NextFunction } from "express";
import Post, { IPost } from "../models/Post";
import ErrorHandler from "../utils/errorHandler";
import { cloudinary } from "../config/cloudinary"; // Import cloudinary instance
import { Types } from "mongoose"; // For ObjectId type checking

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private (Admin only)
const createPost = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new ErrorHandler("Only administrators can create posts.", 403));
  }

  const { title, content, category, event: eventId } = req.body;

  if (!title || !content) {
    return next(new ErrorHandler("Post title and content are required.", 400));
  }

  const validCategories = ["Notice", "Announcement", "General"];
  const postCategory =
    category && validCategories.includes(category) ? category : "General";

  const images: { public_id: string; url: string }[] = [];

  // Upload multiple images to Cloudinary
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    try {
      for (const file of req.files as Express.Multer.File[]) {
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer?.toString("base64")}`,
          {
            folder: "sajiloevents/post_images",
            resource_type: "image",
            quality: "auto:low",
            fetch_format: "auto",
          }
        );
        images.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    } catch (uploadError: any) {
      console.error("Cloudinary upload error:", uploadError);
      return next(
        new ErrorHandler("Error uploading post images. Please try again.", 500)
      );
    }
  }

  try {
    const postData: IPost = {
      title,
      content,
      category: postCategory,
      images,
      author: req.user._id as Types.ObjectId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IPost;

    if (eventId && Types.ObjectId.isValid(eventId)) {
      postData.event = Types.ObjectId.createFromHexString(eventId);
    }

    const post = await Post.create(postData);

    res.status(201).json({
      success: true,
      message: "Post created successfully!",
      post,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getAllPosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const posts = await Post.find()
      .populate("author", "fullName email") // Populate author details
      .populate("event", "title eventDate location"); // Populate related event details

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Get posts created by the logged-in admin
// @route   GET /api/admin/posts
// @access  Private (Admin only)
const getMyPosts = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new ErrorHandler("Only admins can create posts.", 403));
  }
  try {
    const posts = await Post.find({ author: req.user._id })
      .populate("author", "fullName email")
      .populate("event", "title eventDate location");

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "fullName email")
      .populate("event", "title eventDate location");

    if (!post) {
      return next(new ErrorHandler("Post not found.", 404));
    }

    res.status(200).json({
      success: true,
      post,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (Admin only, owner only)
const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new ErrorHandler("Only administrators can update posts.", 403));
  }

  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return next(new ErrorHandler("Post not found.", 404));
    }

    // STRICT OWNERSHIP CHECK: Only the author can update the post
    if (post.author.toString() !== req.user.id.toString()) {
      return next(
        new ErrorHandler(
          "You are not authorized to update this post. Only the post author can.",
          403
        )
      );
    }

    // Validate and prepare category update if provided
    const validCategories = ["Notice", "Announcement", "General"];
    let categoryToUpdate = post.category;
    if (req.body.category !== undefined) {
      if (validCategories.includes(req.body.category)) {
        categoryToUpdate = req.body.category;
      } else {
        return next(new ErrorHandler("Invalid category provided.", 400));
      }
    }

    // Prepare update data for fields that are being SET
    const setUpdate: Partial<IPost> = {
      title: req.body.title || post.title,
      content: req.body.content || post.content,
      category: categoryToUpdate,
      updatedAt: new Date(),
    };

    // Handle optional event ID update
    if (req.body.event !== undefined) {
      // Check if event field is sent in request
      if (req.body.event && Types.ObjectId.isValid(req.body.event)) {
        setUpdate.event = Types.ObjectId.createFromHexString(req.body.event);
      } else if (req.body.event === "") {
        // If client sends empty string to clear event
        delete setUpdate.event; // Remove from $set to avoid setting null/empty string
        (post as any).$unset("event"); // Use $unset directly on the document (preferred for removal)
      } else {
        return next(
          new ErrorHandler("Invalid event ID provided for post.", 400)
        );
      }
    }

    // Handle image updates
    let newImages: { public_id: string; url: string }[] = post.images || [];

    // If new files are uploaded, first delete old ones then upload new ones
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // MANDATORY: Delete existing images from Cloudinary
      for (const image of newImages) {
        await cloudinary.uploader.destroy(image.public_id);
        console.log(
          `Deleted old post image from Cloudinary: ${image.public_id}`
        );
      }
      newImages = []; // Clear array for new uploads

      // Upload new images
      for (const file of req.files as Express.Multer.File[]) {
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer?.toString("base64")}`,
          {
            folder: "sajiloevents/post_images",
            resource_type: "image",
            quality: "auto:low",
            fetch_format: "auto",
          }
        );
        newImages.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
      setUpdate.images = newImages; // Assign the new image array
    } else if (
      req.body.clearImages === "true" &&
      post.images &&
      post.images.length > 0
    ) {
      // If no new files but clearImages flag is true, delete all existing images
      for (const image of newImages) {
        await cloudinary.uploader.destroy(image.public_id);
        console.log(
          `Deleted all post images from Cloudinary: ${image.public_id}`
        );
      }
      setUpdate.images = []; // Set images array to empty
    }

    // Find and update the post
    // Use the direct update method for mixed $set and $unset
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      { $set: setUpdate }, // Use $set for all properties in setUpdate
      { new: true, runValidators: true }
    )
      .populate("author", "fullName email")
      .populate("event", "title eventDate location");

    if (!updatedPost) {
      return next(new ErrorHandler("Failed to update post.", 500));
    }

    res.status(200).json({
      success: true,
      message: "Post updated successfully!",
      post: updatedPost,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Admin only, owner only)
const deletePost = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new ErrorHandler("Only administrators can delete posts.", 403));
  }

  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new ErrorHandler("Post not found.", 404));
    }

    // STRICT OWNERSHIP CHECK: Only the author can delete the post
    if (post.author.toString() !== req.user.id.toString()) {
      return next(
        new ErrorHandler(
          "You are not authorized to delete this post. Only the post author can.",
          403
        )
      );
    }

    // MANDATORY: Delete all associated images from Cloudinary
    if (post.images && post.images.length > 0) {
      for (const image of post.images) {
        await cloudinary.uploader.destroy(image.public_id);
        console.log(
          `Deleted post image from Cloudinary on post deletion: ${image.public_id}`
        );
      }
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully!",
    });
  } catch (error: any) {
    next(error);
  }
};

export {
  createPost,
  getAllPosts,
  getMyPosts,
  getPostById,
  updatePost,
  deletePost,
};
