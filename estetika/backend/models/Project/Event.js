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
    repeat: { type: Boolean, default: false },
    color: String,
    file: String,
    notes: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);
