const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
    },
    imageLink: Date,
    specification: Date,
    budget: Date,
    type: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", eventSchema);
