const SubPhase = require("../../models/Project/SubPhase");
const Phase = require("../../models/Project/Phase");
const User = require("../../models/User/User");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const Project = require("../../models/Project/Project");

// Get SubPhase by Id or ProjectId
const subphase_get = catchAsync(async (req, res, next) => {
  const { id, projectId } = req.query;

  let subphase;

  if (!id && !projectId)
    return next(new AppError("SubPhase identifier not found", 400));

  if (id) {
    subphase = await SubPhase.findById(id)
      .populate("phaseId")
      .populate("projectId")
      .populate("userId", "-password");
  } else {
    subphase = await SubPhase.find({ projectId })
      .populate("phaseId")
      .populate("projectId")
      .populate("userId", "-password");
  }

  if (!subphase)
    return next(
      new AppError("SubPhase not found. Invalid SubPhase Identifier.", 404)
    );

  return res
    .status(200)
    .json({ message: "SubPhase Successfully Fetched", subphase });
});

// Create SubPhase
const subphase_post = catchAsync(async (req, res, next) => {
  const userId = req.id;
  const { title, status, startDate, endDate, phaseId, projectId } = req.body;

  const isUserValid = await User.findById(userId);

  if (!isUserValid)
    return next(new AppError("User not found. Invalid User ID.", 404));

  if (!title || !phaseId || !projectId) {
    return next(new AppError("Cannot create subphase, missing fields.", 400));
  }

  const isProjectValid = await Project.findById(projectId);

  if (!isProjectValid)
    return next(new AppError("Project not found. Invalid Project ID.", 404));

  const isPhaseId = await Phase.findById(phaseId);

  if (!isPhaseId)
    return next(
      new AppError("Project Phase not found. Invalid Phase ID.", 404)
    );

  const newSubPhase = new SubPhase({
    title,
    status,
    startDate,
    endDate,
    phaseId,
    projectId,
    userId,
  });

  await newSubPhase.save();

  await Phase.findByIdAndUpdate(
    phaseId,
    { $push: { subPhaseId: newSubPhase._id } },
    { new: true }
  );

  return res
    .status(200)
    .json({ message: "SubPhase Successfully Created", newSubPhase });
});

// Update SubPhase
const subphase_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const { title, status, startDate, endDate, phaseId, projectId } = req.body;

  if (!id) return next(new AppError("SubPhase identifier not found", 400));

  if (!title && !status && !startDate && !endDate && !phaseId && !projectId) {
    return next(new AppError("No data to update", 400));
  }

  const subphase = await SubPhase.findById(id);

  if (!subphase) {
    return next(new AppError("SubPhase not found. Invalid SubPhase ID.", 404));
  }

  let updates = {};

  if (title) updates.title = title;
  if (status) updates.status = status;
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;
  if (phaseId) updates.phaseId = phaseId;
  if (projectId) updates.projectId = projectId;

  const updatedSubPhase = await SubPhase.findByIdAndUpdate(id, updates, {
    new: true,
  });

  if (!updatedSubPhase) {
    return next(new AppError("SubPhase not found", 404));
  }

  return res
    .status(200)
    .json({ message: "SubPhase Updated Successfully", updatedSubPhase });
});

// Delete SubPhase
const subphase_delete = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new AppError("SubPhase identifier not found", 400));

  const subphase = await SubPhase.findById(id);
  if (!subphase) return next(new AppError("SubPhase not found", 404));

  if (subphase.userId.toString() !== req.id && req.role !== "admin") {
    return next(
      new AppError("You are not authorized to delete this subphase", 403)
    );
  }

  const deletedSubPhase = await SubPhase.findByIdAndDelete(id);

  if (!deletedSubPhase) return next(new AppError("SubPhase not found", 404));

  await Phase.findByIdAndUpdate(
    deletedSubPhase.projectId,
    { $pull: { subPhaseId: deletedSubPhase._id } },
    { new: true }
  );

  return res
    .status(200)
    .json({ message: "SubPhase Successfully Deleted", deletedSubPhase });
});

module.exports = {
  subphase_get,
  subphase_post,
  subphase_put,
  subphase_delete,
};
