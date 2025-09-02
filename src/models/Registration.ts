import mongoose, { Document, Schema, Types } from "mongoose";
import { RegistrationStatus } from "../types";

export interface IRegistration extends Document {
  event: Types.ObjectId; // Reference to the Event
  student: Types.ObjectId; // Reference to the Student User
  status: RegistrationStatus; // 'pending', 'approved', 'rejected'
  registrationDate: Date;
  paymentProofImage?: string; // URL from Cloudinary, required if event is paid
  adminRemarks?: string; // Optional remarks from admin when changing status
}

const RegistrationSchema: Schema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    registrationDate: {
      type: Date,
      default: Date.now,
    },
    paymentProofImage: {
      type: String, // URL from Cloudinary, required if event is paid
      required: function (this: IRegistration) {
        // This logic will be enforced in controller, but schema can hint
        // If event.isPaid is true, this field should ideally be required.
        // We'll handle this dynamically in the registration controller.
        return false; // Default to not required by schema
      },
    },
    adminRemarks: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure unique registration per student per event
RegistrationSchema.index({ event: 1, student: 1 }, { unique: true });

const Registration = mongoose.model<IRegistration>(
  "Registration",
  RegistrationSchema
);

export default Registration;
