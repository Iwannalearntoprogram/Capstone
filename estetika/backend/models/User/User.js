const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      validate: {
        validator: (value) => !/\d/.test(String(value ?? "")),
        message: "First name cannot contain numbers.",
      },
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      validate: {
        validator: (value) => !/\d/.test(String(value ?? "")),
        message: "Last name cannot contain numbers.",
      },
    },
    fullName: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      trim: true,
    },
    birthday: {
      type: Date,
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
    aboutMe: String,
    department: {
      type: String,
    },
    address: {
      type: String,
    },
    linkedIn: {
      type: String,
    },
    employeeId: {
      type: String,
    },
    emergencyContactInfo: {
      type: String,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: (value) =>
          !value || /^\+63\d{10}$/.test(String(value).replace(/\s+/g, "")),
        message: "Phone number must start with +63 and include 10 digits after it.",
      },
    },
    profileImage: String,
    googleId: { type: String, unique: true, sparse: true },
    avatar: String,
    role: {
      type: String,
      enum: ["admin", "designer", "client", "storage_admin"],
      default: "client",
    },
    isArchived: { type: Boolean, default: false },
    projectsId: { type: [mongoose.Schema.Types.ObjectId], ref: "Project" },
    emailVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    // Forgot password flow
    resetOtp: { type: String },
    resetOtpExpiresAt: { type: Date },
    pendingPasswordHash: { type: String },
    socketId: { type: String },
    mutedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
