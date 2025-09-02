import mongoose, { Document, Schema, Types } from "mongoose";
import bcrypt from "bcryptjs";
import { UserRole, EventCategory } from "../types";

// Define an interface for the User document
export interface IUser extends Document {
  fullName: string;
  email: string;
  password?: string; // Optional for hardcoded admins (password might not be set directly initially)
  role: UserRole;
  interests: EventCategory[];
  isAdmin: boolean; // Convenience field for role checking
  comparePassword: (candidatePassword: string) => Promise<boolean>;

  // We need to add createdAt and updatedAt to the IUser interface, as they are part of the 'Document' and are automatically added by 'timestamps:true'

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please add a full name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      // Password is required for students who register, but for hardcoded admins, we might set it differently.
      // We'll handle this nuance in the auth logic.
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    interests: {
      type: [String], // Array of strings matching EventCategory
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
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt timestamps
  }
);

// Pre-save hook to hash password before saving
UserSchema.pre<IUser>("save", async function (next) {
  // Only hash the password if it's new or has been modified
  if (!this.isModified("password") || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare entered password with hashed password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false; // If there's no password, it can't be compared
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for isAdmin
UserSchema.virtual("isAdmin").get(function (this: IUser) {
  return this.role === "admin";
});

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
