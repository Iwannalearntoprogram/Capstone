const ProjectUpdate = require("../../models/Project/ProjectUpdate");
const Project = require("../../models/Project/Project");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const Notification = require("../../models/utils/Notification");

// Get ProjectUpdate by id or projectId
const project_update_get = catchAsync(async (req, res, next) => {
  const { id, projectId } = req.query;

  let update;

  if (!id && !projectId)
    return next(new AppError("Project Update identifier not found", 400));

  if (id) {
    update = await ProjectUpdate.findById(id)
      .populate("projectId")
      .populate("clientId", "-password")
      .populate("designerId", "-password");
  } else {
    update = await ProjectUpdate.find({ projectId })
      .populate("projectId")
      .populate("clientId", "-password")
      .populate("designerId", "-password");
  }

  if (!update) return next(new AppError("Project Update not found.", 404));

  return res.status(200).json({
    message: "Project Update(s) Successfully Fetched",
    update,
  });
});

// Create ProjectUpdate
const project_update_post = catchAsync(async (req, res, next) => {
  const { description, imageLink, projectId, clientId, designerId } = req.body;

  if (!description || !projectId)
    return next(new AppError("Cannot create update, missing fields.", 400));

  const isProjectValid = await Project.findById(projectId);
  if (!isProjectValid)
    return next(new AppError("Project not found. Invalid Project ID.", 404));

  const newUpdate = new ProjectUpdate({
    description,
    imageLink,
    projectId,
    clientId,
    designerId,
  });

  await newUpdate.save();

  const project = await Project.findByIdAndUpdate(projectId, {
    $push: { projectUpdates: newUpdate._id },
    new: true,
  });

  await Notification.create({
    recipient: clientId,
    message: `An update has been made to your project: ${project.title}`,
    type: "update",
    project: projectId,
  });

  return res
    .status(200)
    .json({ message: "Project Update Successfully Created", newUpdate });
});

// Update ProjectUpdate
const project_update_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const { description, imageLink, projectId, clientId, designerId } = req.body;

  if (!id)
    return next(new AppError("Project Update identifier not found", 400));

  if (!description && !imageLink && !projectId && !clientId && !designerId)
    return next(new AppError("No data to update", 400));

  const update = await ProjectUpdate.findById(id);
  if (!update)
    return next(new AppError("Project Update not found. Invalid ID.", 404));

  let updates = {};
  if (description) updates.description = description;
  if (imageLink) updates.imageLink = imageLink;
  if (projectId) updates.projectId = projectId;
  if (clientId) updates.clientId = clientId;
  if (designerId) updates.designerId = designerId;

  const updatedUpdate = await ProjectUpdate.findByIdAndUpdate(id, updates, {
    new: true,
  });

  if (!updatedUpdate)
    return next(new AppError("Project Update not found", 404));

  return res
    .status(200)
    .json({ message: "Project Update Updated Successfully", updatedUpdate });
});

// Delete ProjectUpdate
const project_update_delete = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id)
    return next(new AppError("Project Update identifier not found", 400));

  const update = await ProjectUpdate.findById(id);
  if (!update) return next(new AppError("Project Update not found", 404));

  const deletedUpdate = await ProjectUpdate.findByIdAndDelete(id);

  if (!deletedUpdate)
    return next(new AppError("Project Update not found", 404));

  return res
    .status(200)
    .json({ message: "Project Update Successfully Deleted", deletedUpdate });
});

module.exports = {
  project_update_get,
  project_update_post,
  project_update_put,
  project_update_delete,
};
