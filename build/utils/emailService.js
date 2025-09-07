"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRegistrationNotification = void 0;
const nodemailer_1 = __importDefault(require("../config/nodemailer"));
// Sends an email using Nodemailer transporter
const sendEmail = (mailDetails) => __awaiter(void 0, void 0, void 0, function* () {
    return yield nodemailer_1.default.sendMail(mailDetails);
});
// Sends registration approval/rejection notification to a student
const sendRegistrationNotification = (registration, student, event) => __awaiter(void 0, void 0, void 0, function* () {
    const isApproved = registration.status === "approved";
    const subject = isApproved
        ? `Your registration for "${event.title}" has been Approved 🎉`
        : `Your registration for "${event.title}" has been Rejected 😔`;
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: ${isApproved ? "#28a745" : "#dc3545"};">Hello, ${student.fullName}!</h2>
      <p>This is to inform you about the status of your registration for the event:</p>
      <h3 style="color: #007bff;">${event.title}</h3>
      <p>Your registration has been <strong>${isApproved ? "Approved" : "Rejected"}</strong>.</p>
      ${isApproved
        ? `<p>We are excited to see you there! Your spot is confirmed.</p>`
        : `<p>Unfortunately, your registration was not approved at this time. Please check the event details for more information.</p>`}
      ${registration.adminRemarks
        ? `<p style="font-style: italic; color: #666;"><strong>Admin Remarks:</strong> ${registration.adminRemarks}</p>`
        : ""}
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p><strong>Event Details:</strong></p>
      <ul>
        <li><strong>Date:</strong> ${new Date(event.eventDate).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${event.eventTime}</li>
        <li><strong>Location:</strong> ${event.location}</li>
      </ul>
      <p>Thank you,</p>
      <p>SajiloEvents Team</p>
    </div>
  `;
    console.log("📤 Sending email FROM:", process.env.SMTP_USER_EMAIL);
    const mailDetails = {
        from: {
            name: "SajiloEvents",
            address: process.env.SMTP_USER_EMAIL || process.env.SMTP_USER || "", // Must be verified email in Brevo
        },
        to: student.email,
        subject,
        html: htmlContent,
    };
    return yield sendEmail(mailDetails);
});
exports.sendRegistrationNotification = sendRegistrationNotification;
