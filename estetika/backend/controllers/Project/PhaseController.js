const Phase = require("../../models/Project/Phase");
const User = require("../../models/User/User");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const Project = require("../../models/Project/Project");
const Notification = require("../../models/utils/Notification");
const notifyMany = require("../../utils/notifyMany");

// Get Phase by Id or ProjectId
const phase_get = catchAsync(async (req, res, next) => {
  const { id, projectId } = req.query;

  let phase;

  if (!id && !projectId)
    return next(new AppError("Phase identifier not found", 400));

  if (id) {
    phase = await Phase.findById(id)
      .populate("projectId")
      .populate("tasks")
      .populate("userId", "-password");
  } else {
    phase = await Phase.find({ projectId })
      .populate("projectId")
      .populate("tasks")
      .populate("userId", "-password");
  }

  if (!phase)
    return next(
      new AppError("Phase not found. Invalid Phase Identifier.", 404)
    );

  const computeProgress = (tasksArray) => {
    if (!Array.isArray(tasksArray) || tasksArray.length === 0) return 0;
    const weight = 100 / tasksArray.length;
    let total = 0;
    for (const t of tasksArray) {
      if (t && t.status === "completed") total += weight;
    }
    // Guard against floating point drift
    return Number(total.toFixed(2));
  };

  if (id) {
    phase.progress = computeProgress(phase.tasks);
  } else if (Array.isArray(phase)) {
    phase.forEach((ph) => {
      ph.progress = computeProgress(ph.tasks);
    });
  }

  return res.status(200).json({
    message: `${id ? "" : "Project"} Phase Successfully Fetched`,
    phase,
  });
});

// Create Phase
const phase_post = catchAsync(async (req, res, next) => {
  const userId = req.id;
  const { title, startDate, endDate, projectId, progress } = req.body;

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

  // Notify members about the new phase (exclude client, no admins)
  try {
    const project = await Project.findById(projectId).populate(
      "members projectCreator"
    );
    const clientId = (
      project?.projectCreator?._id || project?.projectCreator
    )?.toString();
    const recipients = (
      Array.isArray(project?.members)
        ? project.members.map((m) => m._id || m)
        : []
    )
      .filter(Boolean)
      .filter((rid) => rid.toString() !== clientId);
    const unique = [...new Set(recipients.map(String))];
    if (unique.length) {
      await notifyMany(
        unique.map((rid) => ({
          recipient: rid,
          message: `New phase "${title}" added to project "${project?.title}"`,
          type: "update",
          phase: newPhase._id,
          project: project?._id,
        }))
      );
    }
  } catch (e) {
    console.error("Notification fan-out failed (new phase):", e?.message);
  }

  return res
    .status(200)
    .json({ message: "Phase Successfully Created", newPhase });
});

// Update Phase
const phase_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const { title, startDate, endDate, projectId, progress } = req.body;

  if (!id) return next(new AppError("Phase identifier not found", 400));

  if (!title && !startDate && !endDate && !projectId && !progress) {
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

  if (
    phase.userId.toString() !== req.id &&
    !["admin", "storage_admin"].includes(req.role)
  ) {
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

  await Promise.all([
    Project.db.model("Task").deleteMany({ _id: { $in: deletedPhase.tasks } }),
  ]);

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
