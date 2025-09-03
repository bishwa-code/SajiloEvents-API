"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const eventRoutes_1 = __importDefault(require("./routes/eventRoutes"));
const postRoutes_1 = __importDefault(require("./routes/postRoutes"));
const registrationRoutes_1 = __importDefault(require("./routes/registrationRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Basic route for testing
app.get("/", (req, res) => {
    res.send("SajiloEvents Backend API is running!");
});
// --- Routes ---
app.use("/api/auth", authRoutes_1.default);
app.use("/api/events", eventRoutes_1.default);
app.use("/api/posts", postRoutes_1.default);
app.use("/api/registrations", registrationRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
// IMPORTANT: This error middleware MUST be the LAST middleware used
app.use(errorMiddleware_1.errorMiddleware);
exports.default = app;
