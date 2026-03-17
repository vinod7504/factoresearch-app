const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { generateOtp, hashOtp } = require("../utils/otp");
const { sendOtpEmail } = require("../utils/email");

const OTP_EXPIRY_MINUTES = 10;

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET missing in environment");
  }

  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

const toPublicUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  role: user.role || "user",
  watchlist: Array.isArray(user.watchlist) ? user.watchlist : [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  password: "********"
});

const register = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    if (!username || !email || !phone || !password) {
      return res.status(400).json({
        message: "username, email, phone, and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { phone: phone.trim() }]
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email or phone already registered" });
    }

    const user = await User.create({
      username: username.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      role: "user",
      password
    });

    const token = signToken(user._id);

    return res.status(201).json({
      message: "Registered successfully",
      token,
      user: toPublicUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to register" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id);

    return res.json({
      message: "Login successful",
      token,
      user: toPublicUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to login" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = generateOtp();
    user.resetOtpHash = hashOtp(otp);
    user.resetOtpExpires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await user.save();

    await sendOtpEmail({
      to: user.email,
      otp,
      username: user.username
    });

    return res.json({
      message: "OTP sent to your email"
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to send OTP" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpHash = hashOtp(otp.trim());

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetOtpHash: otpHash,
      resetOtpExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    return res.json({ message: "OTP verified" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to verify OTP" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and newPassword are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const otpHash = hashOtp(otp.trim());

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetOtpHash: otpHash,
      resetOtpExpires: { $gt: new Date() }
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = newPassword;
    user.resetOtpHash = null;
    user.resetOtpExpires = null;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to reset password" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ user: toPublicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch profile" });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMe
};
