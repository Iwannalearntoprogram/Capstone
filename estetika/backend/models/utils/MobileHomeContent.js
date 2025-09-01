const mongoose = require("mongoose");

const mobileHomeContentSchema = new mongoose.Schema(
  {
    carouselImages: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: "Interior design image",
        },
      },
    ],
    aboutText: {
      type: String,
      required: true,
      default:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one active content at a time
mobileHomeContentSchema.pre("save", async function (next) {
  if (this.isActive && this.isNew) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

const MobileHomeContent = mongoose.model(
  "MobileHomeContent",
  mobileHomeContentSchema
);

module.exports = MobileHomeContent;
