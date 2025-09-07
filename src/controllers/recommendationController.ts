import { Request, Response, NextFunction } from "express";
import Event from "../models/Event";
import User from "../models/User";
import { synonyms } from "../utils/synonyms";

export const getRecommendedEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await User.findById(req.user._id);
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
    const expandedInterests = user.interests.flatMap((interest: string) => [
      interest,
      ...(synonyms[interest] || []),
    ]);

    const interestsQuery = expandedInterests.join(" ");

    // Search for relevant events
    const recommendedEvents = await Event.find(
      {
        $text: { $search: interestsQuery },
        eventDate: { $gte: new Date() },
      },
      { score: { $meta: "textScore" } }
    )
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
  } catch (error) {
    next(error);
  }
};
