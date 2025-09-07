import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import postRoutes from "./routes/postRoutes";
import recommendationRoutes from "./routes/recommendationRoutes";
import registrationRoutes from "./routes/registrationRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Basic route for testing
app.get("/", (req, res) => {
  res.send("SajiloEvents Backend API is running!");
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/users", userRoutes);

// IMPORTANT: This error middleware MUST be the LAST middleware used
app.use(errorMiddleware);

export default app;
