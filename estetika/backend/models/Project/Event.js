const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
    },
    alarm: Date,
    startDate: Date,
    endDate: Date,
    location: String,
    color: String,
    file: String,
    notes: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    recipient: { type: [mongoose.Schema.Types.ObjectId], ref: "User" },
    notified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);
