const Project = require("../../models/Project/Project");
const User = require("../../models/User/User");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");

// Get Project by Id or projectCreator
const project_get = catchAsync(async (req, res, next) => {
  const { id, projectCreator } = req.query;

  let project;

  if (!id && !projectCreator)
    return next(new AppError("Project identifier not found", 400));

  if (id) {
    project = await Project.findById(id)
      .populate("members", "-password")
      .populate("tasks")
      .populate("timeline")
      .populate("projectCreator", "-password");
  } else {
    project = await Project.find({ projectCreator })
      .populate("members", "-password")
      .populate("tasks")
      .populate("timeline")
      .populate("projectCreator", "-password");
  }

  if (!project || (Array.isArray(project) && project.length === 0))
    return next(
      new AppError("Project not found. Invalid Project Identifier.", 404)
    );

  return res
    .status(200)
    .json({ message: "Project Successfully Fetched", project });
});

// Create Project
const project_post = catchAsync(async (req, res, next) => {
  const projectCreator = req.id;
  const {
    title,
    description,
    budget,
    startDate,
    endDate,
    members,
    tasks,
    timeline,
  } = req.body;

  const isUserValid = await User.findById(projectCreator);

  if (!isUserValid)
    return next(new AppError("User not found. Invalid User ID.", 404));

  if (!title) {
    return next(new AppError("Cannot create project, missing title.", 400));
  }

  const membersArray = Array.isArray(members) ? members : [];
  if (!membersArray.includes(projectCreator)) {
    membersArray.push(projectCreator);
  }

  const newProject = new Project({
    title,
    description,
    budget,
    startDate,
    endDate,
    members: membersArray,
    tasks,
    timeline,
    projectCreator,
  });

  await newProject.save();

  await User.findByIdAndUpdate(
    projectCreator,
    { $push: { projectsId: newProject._id } },
    { new: true }
  );

  return res
    .status(200)
    .json({ message: "Project Successfully Created", newProject });
});

// Update Project
const project_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const {
    title,
    description,
    budget,
    startDate,
    endDate,
    members,
    tasks,
    timeline,
  } = req.body;

  if (!id) return next(new AppError("Project identifier not found", 400));

  const project = await Project.findById(id);

  if (!project) {
    return next(new AppError("Project not found. Invalid Project ID.", 404));
  }

  let updates = {};

  if (title) updates.title = title;
  if (description) updates.description = description;
  if (budget) updates.budget = budget;
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;
  if (members) updates.members = members;
  if (tasks) updates.tasks = tasks;
  if (timeline) updates.timeline = timeline;

  const updatedProject = await Project.findByIdAndUpdate(id, updates, {
    new: true,
  });

  if (!updatedProject) {
    return next(new AppError("Project not found", 404));
  }

  return res
    .status(200)
    .json({ message: "Project Updated Successfully", updatedProject, project });
});

// Delete Project
const project_delete = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new AppError("Project identifier not found", 400));

  const project = await Project.findById(id);
  if (!project) return next(new AppError("Project not found", 404));

  if (project.projectCreator.toString() !== req.id && req.role !== "admin") {
    return next(
      new AppError("You are not authorized to delete this project", 403)
    );
  }

  // Remove related tasks and timeline phases

  const deletedProject = await Project.findByIdAndDelete(id);

  if (!deletedProject) return next(new AppError("Project not found", 404));

  await Promise.all([
    Project.db.model("Task").deleteMany({ _id: { $in: project.tasks } }),
    Project.db.model("Phase").deleteMany({ _id: { $in: project.timeline } }),
  ]);

  await User.findByIdAndUpdate(
    deletedProject.projectCreator,
    { $pull: { projectsId: deletedProject._id } },
    { new: true }
  );

  return res
    .status(200)
    .json({ message: "Project Successfully Deleted", deletedProject });
});

module.exports = {
  project_get,
  project_post,
  project_put,
  project_delete,
};
