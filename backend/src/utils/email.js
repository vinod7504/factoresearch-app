const nodemailer = require("nodemailer");

const hasSmtpConfig = () => {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

const sendOtpEmail = async ({ to, otp, username }) => {
  if (!hasSmtpConfig()) {
    console.warn(
      `SMTP config missing. OTP for ${to}: ${otp}. Add SMTP env values to send real emails.`
    );
    return { delivered: false, mode: "console" };
  }

  const transporter = getTransporter();

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const name = username || "User";

  await transporter.sendMail({
    from,
    to,
    subject: "Factoresearch password reset OTP",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;max-width:560px;margin:auto;">
        <h2 style="margin-bottom:8px;">Factoresearch Account Recovery</h2>
        <p>Hello ${name},</p>
        <p>Use this OTP to reset your password:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:4px;padding:10px 0;">${otp}</div>
        <p>This OTP will expire in 10 minutes.</p>
        <p>If you did not request this, you can ignore this message.</p>
      </div>
    `
  });

  return { delivered: true, mode: "smtp" };
};

module.exports = {
  sendOtpEmail
};
