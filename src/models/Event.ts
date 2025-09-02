import mongoose, { Document, Schema, Types } from "mongoose";
import { EventCategory } from "../types";

export interface IEvent extends Document {
  title: string;
  description: string;
  category: EventCategory;
  eventDate: Date;
  eventTime: string; // Storing as string, e.g., "10:00 AM" or "14:30"
  location: string;
  organizer: Types.ObjectId; // Reference to the Admin User who created it
  maxAttendees: number;
  eventDeadline: Date;
  isPaid: boolean;
  price?: number; // Optional, only if isPaid is true
  coverImage?: string; // URL of the cover image
  // Add more fields if deemed necessary later, like 'contactInfo', 'materialsToBring', etc.
}

const EventSchema: Schema = new Schema(
  {
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
      type: Schema.Types.ObjectId,
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
      required: function (this: IEvent) {
        return this.isPaid === true; // Required only if isPaid is true
      },
    },
    coverImage: {
      type: String, // URL from Cloudinary
    },
  },
  {
    timestamps: true,
  }
);

const Event = mongoose.model<IEvent>("Event", EventSchema);

export default Event;
