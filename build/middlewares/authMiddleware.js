"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const User_1 = __importDefault(require("../models/User"));
// Protect routes - checks if user is authenticated
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    // Check for token in cookies
    if (req.cookies.token) {
        token = req.cookies.token;
    }
    if (!token) {
        return next(new errorHandler_1.default("Not authorized to access this route. Please log in.", 401));
    }
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Find user by ID and attach to request
        const user = yield User_1.default.findById(decoded.id).select("-password"); // Exclude password from the returned user object
        if (!user) {
            return next(new errorHandler_1.default("No user found with this ID. Invalid token.", 401));
        }
        req.user = user; // Attach the user to the request object
        next();
    }
    catch (error) {
        return next(new errorHandler_1.default("Not authorized, token failed", 401));
    }
});
exports.protect = protect;
// Authorize roles - checks if user has the required role(s)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        var _a;
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new errorHandler_1.default(`User role (${(_a = req.user) === null || _a === void 0 ? void 0 : _a.role}) is not authorized to access this resource.`, 403 // 403 Forbidden
            ));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
