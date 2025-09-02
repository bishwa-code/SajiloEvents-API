import transporter from "../config/nodemailer";
import { IRegistration } from "../models/Registration";
import { IUser } from "../models/User";
import { IEvent } from "../models/Event";

interface IEmailDetails {
  from: string | { name: string; address: string };
  to: string;
  subject: string;
  html: string;
}

// Sends an email using Nodemailer transporter
const sendEmail = async (mailDetails: IEmailDetails) => {
  return await transporter.sendMail(mailDetails);
};

// Sends registration approval/rejection notification to a student
const sendRegistrationNotification = async (
  registration: IRegistration,
  student: IUser,
  event: IEvent
) => {
  const isApproved = registration.status === "approved";

  const subject = isApproved
    ? `Your registration for "${event.title}" has been Approved 🎉`
    : `Your registration for "${event.title}" has been Rejected 😔`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: ${isApproved ? "#28a745" : "#dc3545"};">Hello, ${
    student.fullName
  }!</h2>
      <p>This is to inform you about the status of your registration for the event:</p>
      <h3 style="color: #007bff;">${event.title}</h3>
      <p>Your registration has been <strong>${
        isApproved ? "Approved" : "Rejected"
      }</strong>.</p>
      ${
        isApproved
          ? `<p>We are excited to see you there! Your spot is confirmed.</p>`
          : `<p>Unfortunately, your registration was not approved at this time. Please check the event details for more information.</p>`
      }
      ${
        registration.adminRemarks
          ? `<p style="font-style: italic; color: #666;"><strong>Admin Remarks:</strong> ${registration.adminRemarks}</p>`
          : ""
      }
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p><strong>Event Details:</strong></p>
      <ul>
        <li><strong>Date:</strong> ${new Date(
          event.eventDate
        ).toLocaleDateString()}</li>
        <li><strong>Time:</strong> ${event.eventTime}</li>
        <li><strong>Location:</strong> ${event.location}</li>
      </ul>
      <p>Thank you,</p>
      <p>SajiloEvents Team</p>
    </div>
  `;

  console.log("📤 Sending email FROM:", process.env.SMTP_USER_EMAIL);

  const mailDetails: IEmailDetails = {
    from: {
      name: "SajiloEvents",
      address: process.env.SMTP_USER_EMAIL || process.env.SMTP_USER || "", // Must be verified email in Brevo
    },
    to: student.email,
    subject,
    html: htmlContent,
  };

  return await sendEmail(mailDetails);
};

export { sendRegistrationNotification };
