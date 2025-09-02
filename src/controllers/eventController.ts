import { Request, Response, NextFunction } from "express";
import Event, { IEvent } from "../models/Event";
import User from "../models/User"; // To populate organizer details
import ErrorHandler from "../utils/errorHandler";
import { cloudinary } from "../config/cloudinary"; // Import cloudinary instance

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (Admin only)
const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(
      new ErrorHandler("Only administrators can create events.", 403)
    );
  }

  const {
    title,
    description,
    category,
    eventDate,
    eventTime,
    location,
    maxAttendees,
    eventDeadline,
    isPaid,
    price,
  } = req.body;

  if (
    !title ||
    !description ||
    !category ||
    !eventDate ||
    !eventTime ||
    !location ||
    !maxAttendees ||
    !eventDeadline
  ) {
    return next(
      new ErrorHandler("Please fill all required event fields.", 400)
    );
  }

  if (isNaN(new Date(eventDate).getTime())) {
    return next(new ErrorHandler("Invalid event date format.", 400));
  }
  if (isNaN(new Date(eventDeadline).getTime())) {
    return next(new ErrorHandler("Invalid event deadline format.", 400));
  }
  if (new Date(eventDeadline) > new Date(eventDate)) {
    return next(
      new ErrorHandler("Event deadline cannot be after the event date.", 400)
    );
  }
  if (new Date(eventDate) < new Date()) {
    return next(new ErrorHandler("Event date cannot be in the past.", 400));
  }
  if (maxAttendees <= 0) {
    return next(
      new ErrorHandler("Maximum attendees must be a positive number.", 400)
    );
  }
  // Convert isPaid from string to boolean for validation
  const isPaidBoolean = isPaid === "true";
  if (
    isPaidBoolean &&
    (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0)
  ) {
    return next(
      new ErrorHandler(
        "Price is required and must be a non-negative number for paid events.",
        400
      )
    );
  }

  let coverImage = "";
  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer?.toString(
          "base64"
        )}`,
        {
          folder: "sajiloevents/event_covers",
          resource_type: "image",
          quality: "auto:low",
          fetch_format: "auto",
        }
      );
      coverImage = result.secure_url;
    } catch (uploadError: any) {
      console.error("Cloudinary upload error:", uploadError);
      return next(
        new ErrorHandler(
          "Error uploading event cover image. Please try again.",
          500
        )
      );
    }
  }

  try {
    const event = await Event.create({
      title,
      description,
      category,
      eventDate,
      eventTime,
      location,
      organizer: req.user._id,
      maxAttendees,
      eventDeadline,
      isPaid: isPaidBoolean,
      price: isPaidBoolean ? parseFloat(price) : undefined,
      coverImage,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully!",
      event,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Get all events (for students and public view)
// @route   GET /api/events
// @access  Public
const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const events = await Event.find().populate("organizer", "fullName email");

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "fullName email"
    );

    if (!event) {
      return next(new ErrorHandler("Event not found.", 404));
    }

    res.status(200).json({
      success: true,
      event,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private (Admin only, owner only)
const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(
      new ErrorHandler("Only administrators can update events.", 403)
    );
  }

  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return next(new ErrorHandler("Event not found.", 404));
    }

    // STRICT OWNERSHIP CHECK: Only the organizer can update the event
    if (event.organizer.toString() !== req.user.id.toString()) {
      return next(
        new ErrorHandler(
          "You are not authorized to update this event. Only the event organizer can.",
          403
        )
      );
    }

    let coverImage = event.coverImage; // Keep existing image by default

    // If a new file is uploaded, upload to Cloudinary and update the URL
    if (req.file) {
      // MANDATORY: Delete old image from Cloudinary if it exists
      if (event.coverImage) {
        const publicId = event.coverImage.split("/").pop()?.split(".")[0];
        if (publicId) {
          await cloudinary.uploader.destroy(
            `sajiloevents/event_covers/${publicId}`
          );
          console.log(`Deleted old image from Cloudinary: ${publicId}`); // Log for debugging
        }
      }
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer?.toString(
          "base64"
        )}`,
        {
          folder: "sajiloevents/event_covers",
          resource_type: "image",
          quality: "auto:low",
          fetch_format: "auto",
        }
      );
      coverImage = result.secure_url;
    }

    // Prepare update data for fields that are being SET
    const setUpdate: Partial<IEvent> = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      eventDate: req.body.eventDate,
      eventTime: req.body.eventTime,
      location: req.body.location,
      maxAttendees: req.body.maxAttendees,
      eventDeadline: req.body.eventDeadline,
      isPaid: req.body.isPaid === "true", // Convert string 'true'/'false' to boolean
      coverImage, // Set the cover image (new or old)
    };

    const isPaidBoolean = setUpdate.isPaid;
    const newPrice = parseFloat(req.body.price);

    // Prepare an object for fields that need to be UNSET (removed)
    const unsetUpdate: Record<string, any> = {};

    if (isPaidBoolean) {
      // If client sends isPaid=true but forgets to include price
      // If event is paid, ensure price is a valid number and set it
      if (isNaN(newPrice) || newPrice < 0) {
        return next(
          new ErrorHandler(
            "Price must be a non-negative number for paid events.",
            400
          )
        );
      }
      setUpdate.price = newPrice;
    } else {
      // If event is free, ensure price is explicitly unset
      unsetUpdate.price = ""; // Value doesn't matter for $unset
    }

    // Combine updates: first set existing fields, then unset specific fields if needed
    const updateOperators: Record<string, any> = { $set: setUpdate };
    if (Object.keys(unsetUpdate).length > 0) {
      updateOperators.$unset = unsetUpdate;
    }

    console.log("Update Operators:", updateOperators);

    event = await Event.findByIdAndUpdate(req.params.id, updateOperators, {
      new: true,
      runValidators: true,
    }).populate("organizer", "fullName email");

    res.status(200).json({
      success: true,
      message: "Event updated successfully!",
      event,
    });
  } catch (error: any) {
    next(error);
  }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private (Admin only, owner only)
const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return next(
      new ErrorHandler("Only administrators can delete events.", 403)
    );
  }

  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return next(new ErrorHandler("Event not found.", 404));
    }

    // STRICT OWNERSHIP CHECK: Only the organizer can delete the event
    if (event.organizer.toString() !== req.user.id.toString()) {
      return next(
        new ErrorHandler(
          "You are not authorized to delete this event. Only the event organizer can.",
          403
        )
      );
    }

    // MANDATORY: Delete image from Cloudinary if it exists
    if (event.coverImage) {
      const publicId = event.coverImage.split("/").pop()?.split(".")[0];
      if (publicId) {
        await cloudinary.uploader.destroy(
          `sajiloevents/event_covers/${publicId}`
        );
        console.log(
          `Deleted image from Cloudinary on event deletion: ${publicId}`
        ); // Log for debugging
      }
    }

    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: "Event deleted successfully!",
    });
  } catch (error: any) {
    next(error);
  }
};

export { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent };
