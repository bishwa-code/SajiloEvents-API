import mongoose, { Schema, Document, Types } from "mongoose";

// Define the interface for a Post document
export interface IPost extends Document {
  title: string;
  content: string;
  category: string;
  images?: {
    public_id: string;
    url: string;
  }[];
  author: Types.ObjectId; // Reference to the User who created the post (an Admin)
  event?: Types.ObjectId; // Optional: Reference to an Event if the post is related to it
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema<IPost> = new Schema({
  title: {
    type: String,
    required: [true, "Post title is required"],
    trim: true,
    maxlength: [100, "Post title cannot be more than 100 characters"],
  },
  content: {
    type: String,
    required: [true, "Post content is required"],
  },
  category: {
    type: String,
    enum: ["Notice", "Announcement", "General"],
    default: "General",
    required: true,
  },
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  author: {
    type: Schema.Types.ObjectId,
    ref: "User", // References the User model
    required: true,
  },
  event: {
    type: Schema.Types.ObjectId,
    ref: "Event", // References the Event model
    required: false, // Optional field
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update `updatedAt` field on save
PostSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Update `updatedAt` field on update (for findOneAndUpdate, etc.)
PostSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

const Post = mongoose.model<IPost>("Post", PostSchema);

export default Post;
