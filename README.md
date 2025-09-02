# SajiloEvents Backend API

This is the backend API for the SajiloEvents project, built with Node.js, Express, and TypeScript. It provides all the necessary endpoints for managing users, events, posts, and registrations.

## Features

- User Authentication (Register, Login)
- Event Management (CRUD for admins)
- Post Management (CRUD for admins)
- Registration System (Students can register, Admins can approve/reject)
- Email Notifications for registration status changes
- User Profile Management
- File uploads to Cloudinary for event covers, posts, and payment proofs.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB
- Cloudinary account
- A valid email account for SMTP (e.g., Gmail with App Password)

### Installation

1. Clone the repository:
   git clone [your-repo-url]
   cd SajiloEvents/backend

2. Install dependencies:
   npm install

3. Set up environment variables:
   Create a .env file in the backend directory with the following variables:

   # Server Configuration

   PORT=5000
   NODE_ENV=development

   # MongoDB Connection

   MONGO_URI=your_mongodb_connection_string

   # JWT Secret

   JWT_SECRET=a_very_long_and_secure_secret_key
   JWT_EXPIRE=number_of_days (e.g., 7d)

   # Cloudinary Configuration

   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret

   # Nodemailer SMTP Configuration

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=YOUR_EMAIL_ADDRESS@gmail.com
   SMTP_PASS=YOUR_APP_PASSWORD

   # Brevo SMTP Configuration

   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your_verified_email@example.com
   SMTP_PASS=your_generated_smtp_key

4. Run the server:
   npm run dev

The API will be running on http://localhost:5000.

## API Endpoints

    You will find all those once you go through the code.

## Steps for Brevo (free SMTP email sending)

### 1️⃣ Create a Free Brevo Account

-Go to https://www.brevo.com/
-Click Sign Up Free and create your account.
-Verify your email & phone number (required for free plan).

### 2️⃣ Get SMTP Credentials

- Go to 'SMTP & API' settings in Brevo Dashboard.
- You’ll see something like:
  SMTP Server: smtp-relay.brevo.com
  Port: 587 (TLS)
  Login: your Brevo email (e.g., ---------@smtp-brevo.com)
  Master Password: auto-generated key (Inside 'Your SMTP Keys')
- If you want, click 'Regenerate SMTP Login and Master password' for new.

### 3️⃣ Test Email Sending

- From your project root, run:
  npx ts-node src/testBrevo.ts
