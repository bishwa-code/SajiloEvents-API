import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

async function testBrevo() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"SajiloEvents" <bxk1415@gmail.com>`, // Must be verified in Brevo
      to: "amritalohar5527@gmail.com", // Another email to test
      subject: "Test Email from Brevo SMTP",
      html: "<h1>Hello! This is a test email from Brevo SMTP ✅</h1>",
    });

    console.log("✅ Email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Email send failed:", error);
  }
}

testBrevo();
