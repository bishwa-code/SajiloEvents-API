"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudinary = exports.connectCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const connectCloudinary = () => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET) {
            throw new Error("Cloudinary credentials are not defined in environment variables");
        }
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true, // Use HTTPS
        });
        console.log("Cloudinary Connected");
    }
    catch (error) {
        console.error(`Error connecting to Cloudinary: ${error.message}`);
        // No need to exit process, just log the error. Image upload will fail if not connected.
    }
};
exports.connectCloudinary = connectCloudinary;
