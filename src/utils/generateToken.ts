import jwt from "jsonwebtoken";
import { Response } from "express";
import { IUser } from "../models/User";

// Function to generate a JWT and set it as an HTTP-only cookie
const generateTokenAndSetCookie = (
  user: IUser,
  statusCode: number,
  res: Response
) => {
  if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRE) {
    throw new Error(
      "JWT_SECRET or JWT_EXPIRE is not defined in environment variables"
    );
  }

  // Create token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE as any,
    }
  );

  const isProduction = process.env.NODE_ENV === "production";

  // Set cookie and send response
  res
    .status(statusCode)
    .cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        interests: user.interests,
      },
    });
};

export default generateTokenAndSetCookie;
