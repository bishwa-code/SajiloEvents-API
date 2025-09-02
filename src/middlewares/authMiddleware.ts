import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import ErrorHandler from "../utils/errorHandler";
import User from "../models/User";

// Define the interface for the JWT payload
interface JwtPayload {
  id: string;
  role: string;
  iat: number;
  exp: number;
}

// Protect routes - checks if user is authenticated
const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check for token in cookies
  if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(
      new ErrorHandler(
        "Not authorized to access this route. Please log in.",
        401
      )
    );
  }

  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // Find user by ID and attach to request
    const user = await User.findById(decoded.id).select("-password"); // Exclude password from the returned user object

    if (!user) {
      return next(
        new ErrorHandler("No user found with this ID. Invalid token.", 401)
      );
    }

    req.user = user; // Attach the user to the request object
    next();
  } catch (error) {
    return next(new ErrorHandler("Not authorized, token failed", 401));
  }
};

// Authorize roles - checks if user has the required role(s)
const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `User role (${req.user?.role}) is not authorized to access this resource.`,
          403 // 403 Forbidden
        )
      );
    }
    next();
  };
};

export { protect, authorizeRoles };
