import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import ErrorHandler from "../utils/errorHandler";
import Event from "../models/Event";

// @desc    Get logged in user's profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new ErrorHandler("User not logged in.", 401));
  }

  try {
    // Only return specific, non-sensitive data
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Update user profile details
// @route   PUT /api/users/profile
// @access  Private (Self-update only)
const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new ErrorHandler("User not logged in.", 401));
  }

  const { fullName, interests } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    // Admins cannot update their profile this way, their info is tied to event management
    if (user.role === "admin") {
      return next(
        new ErrorHandler(
          "Administrators cannot update their profile details.",
          403
        )
      );
    }

    // Update fullName if provided
    if (fullName) user.fullName = fullName;

    // Update interests if all_provided are valid
    if (interests) {
      if (!Array.isArray(interests)) {
        return next(
          new ErrorHandler("Interests must be an array of strings.", 400)
        );
      }

      // --- VALIDATION LOGIC FOR INTERESTS ---
      const validCategories = (Event.schema.path("category") as any).options
        .enum;

      const invalidInterests = interests.filter(
        (interest) => !validCategories.includes(interest)
      );

      if (invalidInterests.length > 0) {
        return next(
          new ErrorHandler(
            `Invalid interests provided: ${invalidInterests.join(
              ", "
            )}. Interests must be valid event categories.`,
            400
          )
        );
      }

      user.interests = interests;
    }

    await user.save();

    // Fetch the updated user data and explicitly exclude the password
    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Update user password
// @route   PUT /api/users/profile/password
// @access  Private
const updateUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new ErrorHandler("User not logged in.", 401));
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(
      new ErrorHandler("Please provide both current and new passwords.", 400)
    );
  }

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ErrorHandler("User not found.", 404));
    }

    // Check if the current password is correct using the method in the User model
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ErrorHandler("Incorrect current password.", 401));
    }

    // Update the password
    user.password = newPassword;
    await user.save(); // Mongoose pre-save hook will hash the new password

    res.status(200).json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Get all users (for Admin dashboard)
// @route   GET /api/users
// @access  Private (Admin only)
const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(
      new ErrorHandler("Only administrators can view all users.", 403)
    );
  }

  try {
    // Find only users with the 'student' role
    const students = await User.find({ role: "student" }).select("-password");
    res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error: any) {
    next(error);
  }
};

export { getUserProfile, updateUserProfile, updateUserPassword, getAllUsers };
