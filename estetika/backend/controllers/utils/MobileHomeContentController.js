const MobileHomeContent = require("../../models/utils/MobileHomeContent");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");

// Get active mobile home content
const getContent = catchAsync(async (req, res, next) => {
  let content = await MobileHomeContent.findOne({ isActive: true })
    .populate("updatedBy", "fullName email")
    .sort({ createdAt: -1 });

  if (!content) {
    // Return default content if none exists
    content = {
      carouselImages: [],
      aboutText:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return res.status(200).json({
    status: "success",
    data: {
      content,
    },
  });
});

// Create or update mobile home content
const updateContent = catchAsync(async (req, res, next) => {
  const { aboutText, carouselImages } = req.body;
  const userId = req.id;

  if (!aboutText) {
    return next(new AppError("About text is required", 400));
  }

  // Deactivate all existing content
  await MobileHomeContent.updateMany({}, { isActive: false });

  // Create new content
  const newContent = await MobileHomeContent.create({
    aboutText,
    carouselImages: carouselImages || [],
    updatedBy: userId,
    isActive: true,
  });

  const populatedContent = await MobileHomeContent.findById(
    newContent._id
  ).populate("updatedBy", "fullName email");

  return res.status(201).json({
    status: "success",
    message: "Mobile home content updated successfully",
    data: {
      content: populatedContent,
    },
  });
});

// Add image to carousel
const addCarouselImage = catchAsync(async (req, res, next) => {
  const { imageUrl, alt } = req.body;
  const userId = req.id;

  if (!imageUrl) {
    return next(new AppError("Image URL is required", 400));
  }

  let content = await MobileHomeContent.findOne({ isActive: true });

  if (!content) {
    // Create initial content if none exists
    content = await MobileHomeContent.create({
      carouselImages: [],
      aboutText:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum",
      updatedBy: userId,
      isActive: true,
    });
  }

  content.carouselImages.push({
    url: imageUrl,
    alt: alt || "Interior design image",
  });
  content.updatedBy = userId;

  await content.save();

  const populatedContent = await MobileHomeContent.findById(
    content._id
  ).populate("updatedBy", "fullName email");

  return res.status(200).json({
    status: "success",
    message: "Image added to carousel successfully",
    data: {
      content: populatedContent,
    },
  });
});

// Remove image from carousel
const removeCarouselImage = catchAsync(async (req, res, next) => {
  const { imageId } = req.params;
  const userId = req.id;

  const content = await MobileHomeContent.findOne({ isActive: true });

  if (!content) {
    return next(new AppError("No active mobile home content found", 404));
  }

  const imageIndex = content.carouselImages.findIndex(
    (img) => img._id.toString() === imageId
  );

  if (imageIndex === -1) {
    return next(new AppError("Image not found in carousel", 404));
  }

  content.carouselImages.splice(imageIndex, 1);
  content.updatedBy = userId;

  await content.save();

  const populatedContent = await MobileHomeContent.findById(
    content._id
  ).populate("updatedBy", "fullName email");

  return res.status(200).json({
    status: "success",
    message: "Image removed from carousel successfully",
    data: {
      content: populatedContent,
    },
  });
});

// Update about text only
const updateAboutText = catchAsync(async (req, res, next) => {
  const { aboutText } = req.body;
  const userId = req.id;

  if (!aboutText) {
    return next(new AppError("About text is required", 400));
  }

  let content = await MobileHomeContent.findOne({ isActive: true });

  if (!content) {
    // Create initial content if none exists
    content = await MobileHomeContent.create({
      carouselImages: [],
      aboutText: aboutText,
      updatedBy: userId,
      isActive: true,
    });
  } else {
    content.aboutText = aboutText;
    content.updatedBy = userId;
    await content.save();
  }

  const populatedContent = await MobileHomeContent.findById(
    content._id
  ).populate("updatedBy", "fullName email");

  return res.status(200).json({
    status: "success",
    message: "About text updated successfully",
    data: {
      content: populatedContent,
    },
  });
});

// Get all content history (admin only)
const getContentHistory = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const content = await MobileHomeContent.find()
    .populate("updatedBy", "fullName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await MobileHomeContent.countDocuments();

  return res.status(200).json({
    status: "success",
    results: content.length,
    data: {
      content,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      },
    },
  });
});

module.exports = {
  getContent,
  updateContent,
  addCarouselImage,
  removeCarouselImage,
  updateAboutText,
  getContentHistory,
};
