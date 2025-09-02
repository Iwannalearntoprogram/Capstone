const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    fullName: {
      type: String,
      required: function () {
        return !this.googleId;
      },
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
    aboutMe: String,
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    phoneNumber: String,
    profileImage: String,
    googleId: { type: String, unique: true, sparse: true },
    avatar: String,
    role: {
      type: String,
      enum: ["admin", "designer", "client"],
      default: "client",
    },
    isArchived: { type: Boolean, default: false },
    projectsId: { type: [mongoose.Schema.Types.ObjectId], ref: "Project" },
    emailVerified: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    socketId: { type: String },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
