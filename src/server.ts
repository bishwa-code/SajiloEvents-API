/// <reference path="./types/express.d.ts" />
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db";
import app from "./app";
import { connectCloudinary } from "./config/cloudinary";

connectDB(); // Connect to MongoDB
connectCloudinary(); // Connect to Cloudinary

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});
