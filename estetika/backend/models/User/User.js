const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
    },
    password: { type: String, required: [true, "Password is required"] },
    phoneNumber: { type: String },
    userType: {
      type: String,
      enum: ["admin", "designer", "client"],
      default: "client",
    },
    emailVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
