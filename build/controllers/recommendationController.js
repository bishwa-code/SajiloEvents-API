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
exports.getRecommendedEvents = void 0;
const Event_1 = __importDefault(require("../models/Event"));
const User_1 = __importDefault(require("../models/User"));
const synonyms_1 = require("../utils/synonyms");
const getRecommendedEvents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = yield User_1.default.findById(req.user._id);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: "User not found" });
        }
        if (user.role !== "student") {
            return res.status(403).json({
                success: false,
                message: "Only students can get recommendations",
            });
        }
        if (!user.interests || user.interests.length === 0) {
            return res.status(200).json({
                success: true,
                recommendedEvents: [],
                message: "No interests selected",
            });
        }
        // Expand student interests with synonyms
        const expandedInterests = user.interests.flatMap((interest) => [
            interest,
            ...(synonyms_1.synonyms[interest] || []),
        ]);
        const interestsQuery = expandedInterests.join(" ");
        // Search for relevant events
        const recommendedEvents = yield Event_1.default.find({
            $text: { $search: interestsQuery },
            eventDate: { $gte: new Date() },
        }, { score: { $meta: "textScore" } })
            .sort({ score: { $meta: "textScore" }, eventDate: 1 })
            .limit(10)
            .populate("organizer", "fullName email");
        if (recommendedEvents.length === 0) {
            return res.status(200).json({
                success: true,
                recommendedEvents: [],
                message: "No recommendations available",
            });
        }
        res.status(200).json({ success: true, recommendedEvents });
    }
    catch (error) {
        next(error);
    }
});
exports.getRecommendedEvents = getRecommendedEvents;
