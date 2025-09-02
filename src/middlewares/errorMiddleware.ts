import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler";

// Define a generic error interface to handle different error types
// Properly extend Error and handle optional properties
interface CustomError extends Error {
  statusCode?: number;
  code?: number; // For MongoDB duplicate key errors
  keyValue?: { [key: string]: string }; // For duplicate key errors
  errors?: { [key: string]: { message: string; path: string } }; // For Mongoose validation errors
  path?: string; // Add path for CastError
  value?: any; // Add value for CastError
  name: string; // Ensure name is always a string, as per Error interface
}

const errorMiddleware = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500; // Default to 500 Internal Server Error

  // Keeping error log for full details during development
  console.error(`Error name: ${err.name}`);
  console.error(`Error message: ${err.message}`);
  console.error(`Error stack: ${err.stack}`);

  // Mongoose Bad ObjectId Error (CastError)
  // Check err.name string directly. 'CastError' is a string value.
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid ${error.path || "ID"}: ${
      error.value
    }`; // Use error.path or provide default
    error = new ErrorHandler(message, 404);
  }

  // Mongoose Duplicate Key Error (E11000)
  if (error.code === 11000) {
    // Use error.code because the copy has it
    // Object.keys(error.keyValue!) is safe because we only enter this block if error.keyValue exists (due to error.code === 11000)
    const message = `Duplicate field value entered for ${Object.keys(
      error.keyValue!
    ).join(", ")}. Please use another value.`;
    error = new ErrorHandler(message, 400);
  }

  // Mongoose Validation Error
  if (error.name === "ValidationError") {
    // Use error.name because the copy has it
    const messages = Object.values(error.errors!).map((val) => val.message);
    const message = `Validation Error: ${messages.join(", ")}`;
    error = new ErrorHandler(message, 400);
  }

  // JWT Error: Invalid Token
  if (error.name === "JsonWebTokenError") {
    const message = "JSON Web Token is invalid. Try Again!!!";
    error = new ErrorHandler(message, 401); // 401 Unauthorized
  }

  // JWT Error: Token Expired
  if (error.name === "TokenExpiredError") {
    const message = "JSON Web Token is expired. Try Again!!!";
    error = new ErrorHandler(message, 401); // 401 Unauthorized
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || "Server Error",
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};

export { errorMiddleware };
