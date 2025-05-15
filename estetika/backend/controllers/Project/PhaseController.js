const Phase = require("../../models/Project/Phase");
const User = require("../../models/User/User");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const Project = require("../../models/Project/Project");

// Get Phase by Id or ProjectId
const phase_get = catchAsync(async (req, res, next) => {
  const { id, projectId } = req.query;

  let phase;

  if (!id && !projectId)
    return next(new AppError("Phase identifier not found", 400));

  if (id) {
    phase = await Phase.findById(id)
      .populate("projectId")
      .populate("subPhaseId")
      .populate("userId", "-password");
  } else {
    phase = await Phase.find({ projectId })
      .populate("projectId")
      .populate("subPhaseId")
      .populate("userId", "-password");
  }

  if (!phase)
    return next(
      new AppError("Phase not found. Invalid Phase Identifier.", 404)
    );

  return res.status(200).json({ message: "Phase Successfully Fetched", phase });
});

// Create Phase
const phase_post = catchAsync(async (req, res, next) => {
  const userId = req.id;
  const { title, startDate, endDate, subPhaseId, projectId, progress } =
    req.body;

  const isUserValid = await User.findById(userId);

  if (!isUserValid)
    return next(new AppError("User not found. Invalid User ID.", 404));

  if (!title || !projectId) {
    return next(new AppError("Cannot create phase, missing fields.", 400));
  }

  const isProjectValid = await Project.findById(projectId);

  if (!isProjectValid)
    return next(new AppError("Project not found. Invalid Project ID.", 404));

  const newPhase = new Phase({
    title,
    startDate,
    endDate,
    subPhaseId,
    projectId,
    progress,
    userId,
  });

  await newPhase.save();

  // Append the phase to the project's timeline array
  await Project.findByIdAndUpdate(
    projectId,
    { $push: { timeline: newPhase._id } },
    { new: true }
  );

  return res
    .status(200)
    .json({ message: "Phase Successfully Created", newPhase });
});

// Update Phase
const phase_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const { title, startDate, endDate, subPhaseId, projectId, progress } =
    req.body;

  if (!id) return next(new AppError("Phase identifier not found", 400));

  if (
    !title &&
    !startDate &&
    !endDate &&
    !subPhaseId &&
    !projectId &&
    !progress
  ) {
    return next(new AppError("No data to update", 400));
  }

  const phase = await Phase.findById(id);

  if (!phase) {
    return next(new AppError("Phase not found. Invalid Phase ID.", 404));
  }

  let updates = {};

  if (title) updates.title = title;
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;
  if (subPhaseId) updates.subPhaseId = subPhaseId;
  if (projectId) updates.projectId = projectId;
  if (progress !== undefined) updates.progress = progress;

  const updatedPhase = await Phase.findByIdAndUpdate(id, updates, {
    new: true,
  });

  if (!updatedPhase) {
    return next(new AppError("Phase not found", 404));
  }

  return res
    .status(200)
    .json({ message: "Phase Updated Successfully", updatedPhase });
});

// Delete Phase
const phase_delete = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new AppError("Phase identifier not found", 400));

  const phase = await Phase.findById(id);
  if (!phase) return next(new AppError("Phase not found", 404));

  if (phase.userId.toString() !== req.id && req.role !== "admin") {
    return next(
      new AppError("You are not authorized to delete this phase", 403)
    );
  }

  const deletedPhase = await Phase.findByIdAndDelete(id);

  if (!deletedPhase) return next(new AppError("Phase not found", 404));

  await Project.findByIdAndUpdate(
    deletedPhase.projectId,
    { $pull: { timeline: deletedPhase._id } },
    { new: true }
  );

  return res
    .status(200)
    .json({ message: "Phase Successfully Deleted", deletedPhase });
});

module.exports = {
  phase_get,
  phase_post,
  phase_put,
  phase_delete,
};
