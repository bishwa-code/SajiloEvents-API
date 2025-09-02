import multer from "multer";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler";

// Configure multer storage for in-memory processing
const storage = multer.memoryStorage();

// Middleware factory for single image upload
const uploadSingleImage = (fieldname: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const upload = multer({ storage: storage }).single(fieldname);
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        return next(new ErrorHandler(`File upload error: ${err.message}`, 400));
      } else if (err) {
        // An unknown error occurred.
        return next(
          new ErrorHandler(`Unknown file upload error: ${err.message}`, 500)
        );
      }
      // Everything went fine.
      next();
    });
  };
};

// Middleware factory for multiple image upload
const uploadMultipleImages = (fieldname: string, maxCount = 10) => {
  // Default maxCount to 10
  return (req: Request, res: Response, next: NextFunction) => {
    const upload = multer({ storage: storage }).array(fieldname, maxCount); // .array for multiple files
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return next(
          new ErrorHandler(`Multiple file upload error: ${err.message}`, 400)
        );
      } else if (err) {
        return next(
          new ErrorHandler(
            `Unknown multiple file upload error: ${err.message}`,
            500
          )
        );
      }
      next();
    });
  };
};

export { uploadSingleImage, uploadMultipleImages };
