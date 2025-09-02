import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import ErrorHandler from "../utils/errorHandler";
import generateTokenAndSetCookie from "../utils/generateToken";
import Event from "../models/Event";

// @desc    Register a new student user
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { fullName, email, password, interests } = req.body;

  if (!fullName || !email || !password) {
    return next(
      new ErrorHandler(
        "Please enter all required fields: Full Name, Email, and Password.",
        400
      )
    );
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    return next(new ErrorHandler("User already exists with this email.", 400));
  }

  // ---  Interests validation logic ---
  if (interests) {
    if (!Array.isArray(interests)) {
      return next(
        new ErrorHandler("Interests must be an array of strings.", 400)
      );
    }

    // Get the hardcoded enum values directly from the Event model schema
    const validCategories = (Event.schema.path("category") as any).options.enum;

    // Ensure interests are valid event categories
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
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role: "student", // Default role is student
    interests: interests || [], // Interests are optional during registration
  });

  // Ensure user is created successfully before attempting to generate a token
  if (!user) {
    // This case might occur if Mongoose validation fails in a subtle way not caught earlier
    return next(
      new ErrorHandler(
        "Failed to create user. Invalid user data received or database issue.",
        400
      )
    );
  }

  generateTokenAndSetCookie(user, 201, res);
};

// @desc    Login User (Student or Admin)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password.", 400));
  }

  // Find user by email and select password for comparison
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(
      new ErrorHandler("Invalid credentials (email not found).", 401)
    );
  }

  // Check if password matches
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return next(
      new ErrorHandler("Invalid credentials (password incorrect).", 401)
    );
  }

  // If login successful, generate token and set cookie
  generateTokenAndSetCookie(user, 200, res);
};

// @desc    Logout User
// @route   GET /api/auth/logout
// @access  Public
const logoutUser = (req: Request, res: Response) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// @desc    Register a new admin user (Highly Restricted: for initial setup or by existing admins)
// @route   POST /api/auth/admin-register
// @access  Private (but with specific logic for initial creation)
const registerAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { fullName, email, password, interests } = req.body;

  if (!fullName || !email || !password) {
    return next(
      new ErrorHandler(
        "Please enter all required fields: Full Name, Email, and Password.",
        400
      )
    );
  }

  // OPTION 1: Allow creation ONLY if no admins exist (for initial setup of the very first admin)
  const adminCount = await User.countDocuments({ role: "admin" });
  if (adminCount > 0 && (!req.user || req.user.role !== "admin")) {
    return next(
      new ErrorHandler(
        "Admin registration is restricted. Only existing admins can create more, or no admins should exist.",
        403
      )
    );
  }
  // If req.user exists (meaning someone is logged in), and they are an admin, they can create more.
  // This covers the case where the first admin is created, then that admin can create others.

  // OPTION 2: Only allow if coming from an existing authenticated admin
  // For initial setup, Option 1 combined with running this once without any logged-in user is stronger.
  // If you always want to require an admin to be logged in to create more admins:
  // if (!req.user || req.user.role !== 'admin') {
  //   return next(new ErrorHandler('Only authorized administrators can register new admin users.', 403));
  // }

  // Check if user (any role) already exists with this email
  const userExists = await User.findOne({ email });

  if (userExists) {
    // If an admin with this email exists, prevent re-registration
    if (userExists.role === "admin") {
      return next(
        new ErrorHandler("An admin user with this email already exists.", 400)
      );
    } else {
      // If a student with this email exists, we might want to prevent creating an admin with it
      return next(
        new ErrorHandler(
          "A user with this email already exists (even if not an admin).",
          400
        )
      );
    }
  }

  const user = await User.create({
    fullName,
    email,
    password,
    role: "admin",
    interests: interests || [],
  });

  if (!user) {
    return next(
      new ErrorHandler(
        "Failed to create admin user. Invalid data or database issue.",
        400
      )
    );
  }

  res.status(201).json({
    success: true,
    message: "Admin user registered successfully. They can now log in.",
    admin: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      interests: user.interests,
    },
  });
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req: Request, res: Response, next: NextFunction) => {
  // req.user is populated by the protect middleware
  const user = req.user;

  if (!user) {
    return next(new ErrorHandler("User not found. Please log in.", 404));
  }

  res.status(200).json({
    success: true,
    user: {
      _id: user._id, // Use optional chaining just to be safe
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      interests: user.interests,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
};

export { registerStudent, loginUser, logoutUser, getMe, registerAdmin };
