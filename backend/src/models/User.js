const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const kycSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "In progress", "Submitted", "Verified", "Rejected"],
      default: "Pending"
    },
    fullName: {
      type: String,
      default: ""
    },
    dob: {
      type: String,
      default: ""
    },
    pan: {
      type: String,
      default: ""
    },
    occupation: {
      type: String,
      default: "Salaried"
    },
    investorType: {
      type: String,
      default: "Retail Investor"
    },
    city: {
      type: String,
      default: ""
    },
    state: {
      type: String,
      default: ""
    },
    nominee: {
      type: String,
      default: ""
    },
    redirected: {
      type: Boolean,
      default: false
    },
    updatedAt: {
      type: Date,
      default: null
    },
    submittedAt: {
      type: Date,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewNote: {
      type: String,
      default: ""
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false
    },
    watchlist: {
      type: [String],
      default: ["RELIANCE.NS", "TCS.NS", "INFY.NS"]
    },
    pushTokens: {
      type: [String],
      default: []
    },
    resetOtpHash: {
      type: String,
      default: null
    },
    resetOtpExpires: {
      type: Date,
      default: null
    },
    kyc: {
      type: kycSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function save(next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
