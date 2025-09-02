import { v2 as cloudinary } from "cloudinary";

const connectCloudinary = () => {
  try {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      throw new Error(
        "Cloudinary credentials are not defined in environment variables"
      );
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true, // Use HTTPS
    });
    console.log("Cloudinary Connected");
  } catch (error: any) {
    console.error(`Error connecting to Cloudinary: ${error.message}`);
    // No need to exit process, just log the error. Image upload will fail if not connected.
  }
};

export { connectCloudinary, cloudinary };
