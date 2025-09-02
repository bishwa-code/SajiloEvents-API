import { Request, Response, NextFunction } from "express";
import Registration, { IRegistration } from "../models/Registration";
import Event, { IEvent } from "../models/Event";
import User from "../models/User";
import ErrorHandler from "../utils/errorHandler";
import { cloudinary } from "../config/cloudinary"; // For paymentProofImage uploads
import { Types } from "mongoose";
import { sendRegistrationNotification } from "../utils/emailService";

// @desc    Register a student for an event (initial creation)
// @route   POST /api/registrations
// @access  Private (Student only)
const createRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "student") {
    return next(
      new ErrorHandler("Only students can register for events.", 403)
    );
  }

  const { eventId } = req.body;

  if (!eventId || !Types.ObjectId.isValid(eventId)) {
    return next(
      new ErrorHandler("Valid Event ID is required for registration.", 400)
    );
  }

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return next(new ErrorHandler("Event not found.", 404));
    }

    // Check if event deadline has passed
    if (new Date() > new Date(event.eventDeadline)) {
      return next(
        new ErrorHandler("Registration for this event has closed.", 400)
      );
    }

    // Check if max attendees limit is reached for 'approved' or 'pending' registrations
    const currentApprovedOrPending = await Registration.countDocuments({
      event: eventId,
      status: { $in: ["pending", "approved"] },
    });
    if (currentApprovedOrPending >= event.maxAttendees) {
      return next(
        new ErrorHandler(
          "This event has reached its maximum number of attendees.",
          400
        )
      );
    }

    // Check if user is already registered for this event (pending or approved)
    const existingRegistration = await Registration.findOne({
      student: req.user._id,
      event: eventId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRegistration) {
      return next(
        new ErrorHandler(
          "You are already registered or have a pending registration for this event.",
          400
        )
      );
    }

    let paymentProofImage = "";
    // Handle paymentProofImage upload if event is paid
    if (event.isPaid) {
      if (!req.file) {
        // req.file from uploadSingleImage middleware
        return next(
          new ErrorHandler(
            "Payment proof image is required for paid events.",
            400
          )
        );
      }
      try {
        const result = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer?.toString(
            "base64"
          )}`,
          {
            folder: "sajiloevents/payment_proofs",
            resource_type: "image",
            quality: "auto:low",
            fetch_format: "auto",
          }
        );
        paymentProofImage = result.secure_url;
      } catch (uploadError: any) {
        console.error("Cloudinary upload error:", uploadError);
        return next(
          new ErrorHandler(
            "Error uploading payment proof image. Please try again.",
            500
          )
        );
      }
    } else if (req.file) {
      // If event is free, but a file was sent, don't process it and optionally warn/error
      console.warn("Payment proof image uploaded for a free event. Ignoring.");
    }

    const registrationData: IRegistration = {
      event: eventId,
      student: req.user._id as Types.ObjectId, // Cast for safety, relying on global typing
      status: "pending", // All new registrations start as pending
      registrationDate: new Date(),
      // Only include paymentProofImage if it was uploaded (i.e., for paid events)
      ...(paymentProofImage && { paymentProofImage }),
    } as IRegistration;

    const registration = await Registration.create(registrationData);

    res.status(201).json({
      success: true,
      message: "Registration created successfully. Awaiting admin approval.",
      registration,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error from unique index
      return next(
        new ErrorHandler("You are already registered for this event.", 400)
      );
    }
    next(error);
  }
};

// @desc    Get all registrations for a specific event (Admin only)
// @route   GET /api/registrations/event/:eventId
// @access  Private (Admin only)
const getRegistrationsByEvent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "admin") {
    return next(
      new ErrorHandler("Only administrators can view event registrations.", 403)
    );
  }

  const { eventId } = req.params;

  if (!Types.ObjectId.isValid(eventId)) {
    return next(new ErrorHandler("Valid Event ID is required.", 400));
  }

  try {
    const eventExists = await Event.findById(eventId);
    if (!eventExists) {
      return next(new ErrorHandler("Event not found.", 404));
    }

    const registrations = await Registration.find({ event: eventId })
      .populate("student", "fullName email") // Populate student details
      .populate("event", "title eventDate isPaid price"); // Populate basic event details

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Get all registrations for the logged-in student (Student only)
// @route   GET /api/registrations/my-registrations
// @access  Private (Student only)
const getMyRegistrations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "student") {
    return next(
      new ErrorHandler(
        "Please log in as a student to view your registrations.",
        403
      )
    );
  }

  try {
    const registrations = await Registration.find({ student: req.user._id })
      .populate(
        "event",
        "title description eventDate eventTime location isPaid price coverImage"
      ) // Populate detailed event info
      .sort({ registrationDate: -1 }); // Sort by most recent registration

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Admin updates registration status (approve/reject)
// @route   PUT /api/registrations/:id/status
// @access  Private (Admin only)
const updateRegistrationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "admin") {
    return next(
      new ErrorHandler(
        "Only administrators can update registration status.",
        403
      )
    );
  }

  const { status, adminRemarks } = req.body;
  const { id: registrationId } = req.params;

  if (!registrationId || !Types.ObjectId.isValid(registrationId)) {
    return next(new ErrorHandler("Valid Registration ID is required.", 400));
  }

  const validStatuses = ["approved", "rejected"];
  if (!status || !validStatuses.includes(status)) {
    return next(
      new ErrorHandler(
        `Invalid status provided. Must be one of: ${validStatuses.join(", ")}`,
        400
      )
    );
  }

  try {
    const registration = await Registration.findById(registrationId);

    if (!registration) {
      return next(new ErrorHandler("Registration not found.", 404));
    }

    // Avoid sending duplicate emails if status is the same
    if (registration.status === status) {
      return res.status(200).json({
        success: true,
        message: `Registration status is already ${status}. No changes made.`,
        registration,
      });
    }

    const event = await Event.findById(registration.event);

    // Prevent changing status if event deadline has passed for 'pending' registrations
    if (
      event &&
      new Date() > new Date(event.eventDeadline) &&
      registration.status === "pending"
    ) {
      return next(
        new ErrorHandler(
          "Cannot change status for a pending registration if the event deadline has passed.",
          400
        )
      );
    }

    //  Check max attendees if approving
    if (status === "approved" && event) {
      const currentApproved = await Registration.countDocuments({
        event: registration.event,
        status: "approved",
      });
      if (currentApproved >= event.maxAttendees) {
        return next(
          new ErrorHandler(
            "Approving this registration would exceed the maximum attendees for this event.",
            400
          )
        );
      }
    }

    // ✅ Update and Save Registration
    registration.status = status;
    if (adminRemarks !== undefined) registration.adminRemarks = adminRemarks;
    await registration.save();

    // Fetch Student for Email
    const student = await User.findById(registration.student);

    if (!student || !event) {
      return res.status(200).json({
        success: true,
        message: `Registration status updated to ${status}. Email not sent (student or event missing).`,
        registration,
      });
    }

    try {
      const info = await sendRegistrationNotification(
        registration,
        student,
        event
      );
      console.log(
        `✅ Email sent to: ${student.email} & Message ID: ${info.messageId}`
      );

      return res.status(200).json({
        success: true,
        message: `Registration status updated to ${status}. Email sent successfully.`,
        registration,
      });
    } catch (error: any) {
      console.error(
        `❌ Email send failed to: ${student.email} & Error:`,
        error.message
      );

      return res.status(200).json({
        success: true,
        message: `Registration status updated to ${status}, but email failed to send.`,
        registration,
      });
    }
  } catch (error: any) {
    next(error);
  }
};

// @desc    Admin deletes a registration (e.g., fraudulent, or cleanup)
// @route   DELETE /api/registrations/:id
// @access  Private (Admin only)
const deleteRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== "admin") {
    return next(
      new ErrorHandler("Only administrators can delete registrations.", 403)
    );
  }

  // Note: A registration might be fraudulent, a duplicate, or the student might have contacted the admin directly to request deletion after approval.

  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return next(new ErrorHandler("Registration not found.", 404));
    }

    // MANDATORY: Delete payment proof image from Cloudinary if it exists
    if (registration.paymentProofImage) {
      const publicId = registration.paymentProofImage
        .split("/")
        .pop()
        ?.split(".")[0];
      if (publicId) {
        // Cloudinary public_id for payment proofs are usually in 'folder/id' format,
        // so we need to ensure we get the full path to delete.
        // Assuming public_id is stored directly if created with specific folder.
        // If `public_id` was returned as 'sajiloevents/payment_proofs/xxxx', use that.
        // If it was just 'xxxx', then reconstruct 'sajiloevents/payment_proofs/xxxx'.
        // Let's assume the public_id in the URL is enough to derive it, or store public_id directly in model.
        // For now, let's use the URL's last part, similar to event/post images.
        await cloudinary.uploader.destroy(
          `sajiloevents/payment_proofs/${publicId}`
        );
        console.log(`Deleted payment proof image from Cloudinary: ${publicId}`);
      }
    }

    await registration.deleteOne();

    res.status(200).json({
      success: true,
      message: "Registration deleted successfully.",
    });
  } catch (error: any) {
    next(error);
  }
};

export {
  createRegistration,
  getRegistrationsByEvent,
  getMyRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
};
