const User = require("../models/User");

const USER_EDITABLE_KYC_FIELDS = [
  "fullName",
  "dob",
  "pan",
  "occupation",
  "investorType",
  "city",
  "state",
  "nominee"
];

const ADMIN_ALLOWED_KYC_STATUSES = ["In progress", "Submitted", "Verified", "Rejected"];

const normalizeString = (value) => String(value || "").trim();

const ensureKycObject = (user) => {
  if (!user.kyc) {
    user.kyc = {
      status: "Pending",
      fullName: "",
      dob: "",
      pan: "",
      occupation: "Salaried",
      investorType: "Retail Investor",
      city: "",
      state: "",
      nominee: "",
      redirected: false,
      updatedAt: null,
      submittedAt: null,
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: ""
    };
  }

  return user.kyc;
};

const formatKycForUser = (user) => {
  const kyc = user.kyc || {};

  return {
    status: kyc.status || "Pending",
    fullName: kyc.fullName || user.username || "",
    email: user.email,
    phone: user.phone,
    dob: kyc.dob || "",
    pan: kyc.pan || "",
    occupation: kyc.occupation || "Salaried",
    investorType: kyc.investorType || "Retail Investor",
    city: kyc.city || "",
    state: kyc.state || "",
    nominee: kyc.nominee || "",
    redirected: Boolean(kyc.redirected),
    updatedAt: kyc.updatedAt || null,
    submittedAt: kyc.submittedAt || null,
    reviewedAt: kyc.reviewedAt || null,
    reviewNote: kyc.reviewNote || "",
    reviewedBy: kyc.reviewedBy
      ? {
          id: kyc.reviewedBy._id,
          username: kyc.reviewedBy.username,
          email: kyc.reviewedBy.email
        }
      : null
  };
};

const formatKycForAdmin = (user) => {
  const kyc = user.kyc || {};

  return {
    userId: user._id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    status: kyc.status || "Pending",
    fullName: kyc.fullName || user.username || "",
    dob: kyc.dob || "",
    pan: kyc.pan || "",
    occupation: kyc.occupation || "Salaried",
    investorType: kyc.investorType || "Retail Investor",
    city: kyc.city || "",
    state: kyc.state || "",
    nominee: kyc.nominee || "",
    redirected: Boolean(kyc.redirected),
    updatedAt: kyc.updatedAt || null,
    submittedAt: kyc.submittedAt || null,
    reviewedAt: kyc.reviewedAt || null,
    reviewNote: kyc.reviewNote || "",
    reviewedBy: kyc.reviewedBy
      ? {
          id: kyc.reviewedBy._id,
          username: kyc.reviewedBy.username,
          email: kyc.reviewedBy.email
        }
      : null
  };
};

const applyKycFields = (user, payload) => {
  const kyc = ensureKycObject(user);
  let hasAnyChange = false;

  for (const key of USER_EDITABLE_KYC_FIELDS) {
    if (payload[key] === undefined) {
      continue;
    }

    const normalized = key === "pan" ? normalizeString(payload[key]).toUpperCase() : normalizeString(payload[key]);

    if (kyc[key] !== normalized) {
      kyc[key] = normalized;
      hasAnyChange = true;
    }
  }

  return hasAnyChange;
};

const getMyKyc = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("kyc.reviewedBy", "username email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    ensureKycObject(user);
    return res.json({ kyc: formatKycForUser(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch KYC" });
  }
};

const saveMyKyc = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("kyc.reviewedBy", "username email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    ensureKycObject(user);
    const hasAnyChange = applyKycFields(user, req.body || {});

    if (hasAnyChange && ["Pending", "Rejected"].includes(user.kyc.status)) {
      user.kyc.status = "In progress";
    }

    if (hasAnyChange) {
      user.kyc.updatedAt = new Date();
    }

    if ((req.body || {}).redirected !== undefined) {
      user.kyc.redirected = Boolean((req.body || {}).redirected);
      user.kyc.updatedAt = new Date();
    }

    await user.save();

    return res.json({
      message: "KYC profile saved",
      kyc: formatKycForUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to save KYC" });
  }
};

const startMyKyc = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("kyc.reviewedBy", "username email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    ensureKycObject(user);
    if (["Pending", "Rejected"].includes(user.kyc.status)) {
      user.kyc.status = "In progress";
    }

    user.kyc.redirected = true;
    user.kyc.updatedAt = new Date();

    await user.save();

    return res.json({
      message: "KYC marked in progress",
      kyc: formatKycForUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to start KYC" });
  }
};

const submitMyKyc = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("kyc.reviewedBy", "username email");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    ensureKycObject(user);
    applyKycFields(user, req.body || {});

    const fullName = normalizeString(user.kyc.fullName || user.username);
    const dob = normalizeString(user.kyc.dob);
    const pan = normalizeString(user.kyc.pan).toUpperCase();

    if (!fullName || !dob || !pan) {
      return res.status(400).json({ message: "fullName, dob, and pan are required before submitting KYC" });
    }

    user.kyc.fullName = fullName;
    user.kyc.pan = pan;
    user.kyc.status = "Submitted";
    user.kyc.redirected = true;
    user.kyc.submittedAt = new Date();
    user.kyc.updatedAt = new Date();
    user.kyc.reviewedAt = null;
    user.kyc.reviewedBy = null;
    user.kyc.reviewNote = "";

    await user.save();

    return res.json({
      message: "KYC submitted for admin verification",
      kyc: formatKycForUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to submit KYC" });
  }
};

const getAdminKycSubmissions = async (_req, res) => {
  try {
    const users = await User.find({
      "kyc.status": { $in: ["In progress", "Submitted", "Verified", "Rejected"] }
    })
      .populate("kyc.reviewedBy", "username email")
      .sort({ "kyc.updatedAt": -1, updatedAt: -1 })
      .limit(300);

    return res.json({
      requests: users.map(formatKycForAdmin)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to fetch KYC submissions" });
  }
};

const reviewKycSubmission = async (req, res) => {
  try {
    const userId = req.params.userId;
    const nextStatus = normalizeString(req.body.status);
    const reviewNote = normalizeString(req.body.reviewNote);

    if (!ADMIN_ALLOWED_KYC_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        message: "status must be one of: In progress, Submitted, Verified, Rejected"
      });
    }

    const targetUser = await User.findById(userId).populate("kyc.reviewedBy", "username email");

    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    ensureKycObject(targetUser);
    targetUser.kyc.status = nextStatus;
    targetUser.kyc.updatedAt = new Date();

    if (nextStatus === "In progress" || nextStatus === "Submitted") {
      targetUser.kyc.reviewedAt = null;
      targetUser.kyc.reviewedBy = null;
      targetUser.kyc.reviewNote = "";
    } else {
      targetUser.kyc.reviewedAt = new Date();
      targetUser.kyc.reviewedBy = req.user.id;
      targetUser.kyc.reviewNote = reviewNote;
    }

    await targetUser.save();

    return res.json({
      message: `KYC marked as ${nextStatus}`,
      request: formatKycForAdmin(targetUser)
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to review KYC" });
  }
};

module.exports = {
  getMyKyc,
  saveMyKyc,
  startMyKyc,
  submitMyKyc,
  getAdminKycSubmissions,
  reviewKycSubmission
};
