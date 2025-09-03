"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const EventSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, "Please add an event title"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Please add an event description"],
    },
    category: {
        type: String,
        enum: [
            "Academic",
            "Sports",
            "Tech",
            "Workshop",
            "Hackathon",
            "Cultural",
            "IT Meetups",
            "Orientation",
            "Others",
        ],
        required: [true, "Please select an event category"],
    },
    eventDate: {
        type: Date,
        required: [true, "Please add the event date"],
    },
    eventTime: {
        type: String, // e.g., "10:00 AM", "14:30"
        required: [true, "Please add the event time"],
    },
    location: {
        type: String,
        required: [true, "Please add the event location"],
        trim: true,
    },
    organizer: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model (specifically an admin)
        required: true,
    },
    maxAttendees: {
        type: Number,
        required: [true, "Please specify the maximum number of attendees"],
        min: [1, "Maximum attendees must be at least 1"],
    },
    eventDeadline: {
        type: Date,
        required: [true, "Please add the registration deadline date"],
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    price: {
        type: Number,
        min: [0, "Price cannot be negative"],
        required: function () {
            return this.isPaid === true; // Required only if isPaid is true
        },
    },
    coverImage: {
        type: String, // URL from Cloudinary
    },
}, {
    timestamps: true,
});
const Event = mongoose_1.default.model("Event", EventSchema);
exports.default = Event;
