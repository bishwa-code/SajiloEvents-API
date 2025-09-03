"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleImages = exports.uploadSingleImage = void 0;
const multer_1 = __importDefault(require("multer"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
// Configure multer storage for in-memory processing
const storage = multer_1.default.memoryStorage();
// Middleware factory for single image upload
const uploadSingleImage = (fieldname) => {
    return (req, res, next) => {
        const upload = (0, multer_1.default)({ storage: storage }).single(fieldname);
        upload(req, res, function (err) {
            if (err instanceof multer_1.default.MulterError) {
                // A Multer error occurred when uploading.
                return next(new errorHandler_1.default(`File upload error: ${err.message}`, 400));
            }
            else if (err) {
                // An unknown error occurred.
                return next(new errorHandler_1.default(`Unknown file upload error: ${err.message}`, 500));
            }
            // Everything went fine.
            next();
        });
    };
};
exports.uploadSingleImage = uploadSingleImage;
// Middleware factory for multiple image upload
const uploadMultipleImages = (fieldname, maxCount = 10) => {
    // Default maxCount to 10
    return (req, res, next) => {
        const upload = (0, multer_1.default)({ storage: storage }).array(fieldname, maxCount); // .array for multiple files
        upload(req, res, function (err) {
            if (err instanceof multer_1.default.MulterError) {
                return next(new errorHandler_1.default(`Multiple file upload error: ${err.message}`, 400));
            }
            else if (err) {
                return next(new errorHandler_1.default(`Unknown multiple file upload error: ${err.message}`, 500));
            }
            next();
        });
    };
};
exports.uploadMultipleImages = uploadMultipleImages;
