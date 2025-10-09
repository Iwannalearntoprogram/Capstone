const Project = require("../../models/Project/Project");
const User = require("../../models/User/User");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const Material = require("../../models/Project/Material");
const DeletedProject = require("../../models/Project/DeletedProject");
const Notification = require("../../models/utils/Notification");
const notifyMany = require("../../utils/notifyMany");
require("../../utils/recycleBinCron");

// Get Project by Id or projectCreator
const project_get = catchAsync(async (req, res, next) => {
  const { id, projectCreator, member, index } = req.query;

  let project;

  if (!id && !projectCreator && !member && !index)
    return next(new AppError("Project identifier not found", 400));
  const populateOptions = [
    { path: "members", select: "-password" },
    { path: "tasks" },
    { path: "timeline", populate: { path: "tasks" } },
    { path: "projectCreator", select: "-password" },
    { path: "projectUpdates" },
    { path: "designRecommendation" },
    { path: "materials.material" },
  ];

  if (id) {
    project = await Project.findById(id).populate(populateOptions);
  } else if (projectCreator) {
    project = await Project.find({ projectCreator }).populate(populateOptions);
  } else if (member) {
    project = await Project.find({ members: member }).populate(populateOptions);
  } else if (index) {
    project = await Project.find().populate(populateOptions);
  }

  if (!project || (Array.isArray(project) && project.length === 0))
    return next(
      new AppError("Project not found. Invalid Project Identifier.", 404)
    );

  const isPastEndDate = (endDate) => {
    if (!endDate) return false;
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  };

  if (id) {
    project = project.toObject ? project.toObject() : project;
    if (project.timeline && Array.isArray(project.timeline)) {
      project.timeline.forEach((ph) => {
        let weight =
          ph.tasks && ph.tasks.length > 0 ? 100 / ph.tasks.length : 0;
        let total = 0;

        if (ph.tasks && Array.isArray(ph.tasks)) {
          ph.tasks.forEach((task) => {
            if (task.status === "completed") {
              total += weight;
            }
          });
        }

        ph.progress = total;
      });

      let totalPhases = project.timeline.length;
      let overallProgress = 0;
      if (totalPhases > 0) {
        overallProgress =
          project.timeline.reduce((sum, ph) => sum + (ph.progress || 0), 0) /
          totalPhases;
      }
      project.progress = overallProgress;
    } else {
      project.progress = 0;
    }

    if (isPastEndDate(project.endDate) && project.status === "ongoing") {
      project.status = "delayed";
    }
  } else {
    project.forEach((proj, idx) => {
      if (proj.toObject) project[idx] = proj = proj.toObject();
      if (proj.timeline && Array.isArray(proj.timeline)) {
        proj.timeline.forEach((ph) => {
          let weight =
            ph.tasks && ph.tasks.length > 0 ? 100 / ph.tasks.length : 0;
          let total = 0;

          if (ph.tasks && Array.isArray(ph.tasks)) {
            ph.tasks.forEach((task) => {
              if (task.status === "completed") {
                total += weight;
              }
            });
          }

          ph.progress = total;
        });
      }
    });

    project.forEach((proj, idx) => {
      if (
        proj.timeline &&
        Array.isArray(proj.timeline) &&
        proj.timeline.length > 0
      ) {
        const totalPhases = proj.timeline.length;
        const overallProgress =
          proj.timeline.reduce((sum, ph) => sum + (ph.progress || 0), 0) /
          totalPhases;
        proj.progress = overallProgress;
      } else {
        proj.progress = 0;
      }

      if (isPastEndDate(proj.endDate) && proj.status === "ongoing") {
        proj.status = "delayed";
      }
    });
  }

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
    files,
    tasks,
    timeline,
    roomType,
    projectSize,
    projectLocation,
    designPreference,
    designInspiration,
    designRecommendation,
  } = req.body;

  const isUserValid = await User.findById(projectCreator);

  if (!isUserValid)
    return next(new AppError("User not found. Invalid User ID.", 404));

  if (!title) {
    return next(new AppError("Cannot create project, missing title.", 400));
  }

  const newProject = new Project({
    title,
    description,
    budget,
    startDate,
    endDate,
    files,
    tasks,
    timeline,
    projectCreator,
    roomType,
    projectSize,
    projectLocation,
    designPreference,
    designInspiration,
    designRecommendation,
  });

  await newProject.save();

  await User.findByIdAndUpdate(
    projectCreator,
    { $push: { projectsId: newProject._id } },
    { new: true }
  );

  // Notifications: new pending project -> ONLY admins (exclude storage_admin). File reminder only to client.
  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    if (newProject.status === "pending" && admins.length > 0) {
      await notifyMany(
        admins.map((a) => ({
          recipient: a._id,
          message: `New pending project created: ${newProject.title}`,
          type: "update",
          project: newProject._id,
        }))
      );
    }
    if (!newProject.files || newProject.files.length === 0) {
      await notifyMany([
        {
          recipient: projectCreator,
          message: `Don't forget to upload files for project: ${newProject.title}`,
          type: "update",
          project: newProject._id,
        },
      ]);
    }
  } catch (e) {
    console.error("Notification fan-out failed (new project):", e?.message);
  }

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
    files,
    members,
    tasks,
    timeline,
    status,
    roomType,
    projectSize,
    projectLocation,
    designPreference,
    designInspiration,
    designRecommendation,
    projectUpdates,
  } = req.body;

  if (!id) return next(new AppError("Project identifier not found", 400));

  const project = await Project.findById(id);
  if (!project)
    return next(new AppError("Project not found. Invalid Project ID.", 404));

  const originalMembers = Array.isArray(project.members)
    ? project.members.map((m) => m.toString())
    : [];

  let updates = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (budget !== undefined) updates.budget = budget;
  if (startDate) updates.startDate = startDate;
  if (endDate) updates.endDate = endDate;
  if (files) updates.files = files;
  if (members) {
    if (Array.isArray(members)) {
      const resolvedMembers = await Promise.all(
        members.map(async (member) => {
          if (project.members.includes(member)) {
            return member;
          }
          const user = await User.findOne({
            $or: [{ email: member }, { username: member }],
          });
          return user ? user._id : null;
        })
      );
      updates.members = resolvedMembers.filter(Boolean);
    }
  }
  if (tasks) updates.tasks = tasks;
  if (timeline) updates.timeline = timeline;
  if (status) updates.status = status;
  if (roomType) updates.roomType = roomType;
  if (projectSize !== undefined) updates.projectSize = projectSize;
  if (projectLocation) updates.projectLocation = projectLocation;
  if (designPreference) updates.designPreference = designPreference;
  if (designInspiration) updates.designInspiration = designInspiration;
  if (designRecommendation) updates.designRecommendation = designRecommendation;
  if (projectUpdates) updates.projectUpdates = projectUpdates;

  const updatedProject = await Project.findByIdAndUpdate(id, updates, {
    new: true,
  });

  if (!updatedProject) return next(new AppError("Project not found", 404));

  // Send notification when project is approved (status changes from pending to ongoing)
  if (status === "ongoing" && project.status === "pending") {
    try {
      const designers = Array.isArray(updatedProject.members)
        ? updatedProject.members.map((m) => m.toString())
        : [];
      const designerUsers = await User.find({ _id: { $in: designers } }).select(
        "fullName"
      );
      const designerNames =
        designerUsers.map((d) => d.fullName).join(", ") ||
        "No designers assigned yet";
      const recipients = [project.projectCreator, ...designers]
        .filter(Boolean)
        .map((r) => r.toString());
      const unique = [...new Set(recipients)];
      if (unique.length) {
        await notifyMany(
          unique.map((rid) => ({
            recipient: rid,
            message: `Project "${project.title}" approved. Assigned designer(s): ${designerNames}`,
            type: "project-approved",
            project: project._id,
          }))
        );
      }
    } catch (e) {
      console.error("Failed approval notification:", e?.message);
    }
  }
  // Decline path: notify client only
  if (status === "declined" && project.status === "pending") {
    try {
      await notifyMany([
        {
          recipient: project.projectCreator,
          message: `Your project "${project.title}" was declined.`,
          type: "update",
          project: project._id,
        },
      ]);
    } catch (e) {
      console.error("Failed decline notification:", e?.message);
    }
  }

  if (status === "completed" && project.status !== "completed") {
    await Promise.all(
      project.materials.map(async (materialEntry) => {
        const material = await Material.findById(materialEntry.material);
        if (material) {
          // Ensure sales is a valid number, default to 0 if undefined/null/NaN
          const currentSales =
            isNaN(material.sales) || material.sales == null
              ? 0
              : Number(material.sales);
          material.sales = Math.max(0, currentSales + materialEntry.quantity);
          await material.save();
        }
      })
    );
  }

  if (project.status === "completed" && status !== "completed") {
    await Promise.all(
      project.materials.map(async (materialEntry) => {
        const material = await Material.findById(materialEntry.material);
        if (material) {
          // Ensure sales is a valid number, default to 0 if undefined/null/NaN
          const currentSales =
            isNaN(material.sales) || material.sales == null
              ? 0
              : Number(material.sales);
          material.sales = Math.max(0, currentSales - materialEntry.quantity);
          await material.save();
        }
      })
    );
  }

  // Notify client about newly added designers (only after project is ongoing)
  if (project.status === "ongoing" || updatedProject.status === "ongoing") {
    try {
      const updatedMemberIds = Array.isArray(updatedProject.members)
        ? updatedProject.members.map((m) => m.toString())
        : [];
      const originalSet = new Set(originalMembers);
      const newlyAdded = updatedMemberIds.filter((id) => !originalSet.has(id));
      if (newlyAdded.length) {
        const newUsers = await User.find({ _id: { $in: newlyAdded } }).select(
          "fullName"
        );
        if (newUsers.length) {
          await notifyMany(
            newUsers.map((u) => ({
              recipient: project.projectCreator,
              message: `New designer added to project "${project.title}": ${u.fullName}`,
              type: "update",
              project: project._id,
            }))
          );
          console.log(
            `👥 Notified client about ${
              newUsers.length
            } new designer(s): ${newUsers.map((u) => u.fullName).join(", ")}`
          );
        }
      }
    } catch (e) {
      console.error("Failed new-designer notification:", e?.message);
    }
  }

  return res
    .status(200)
    .json({ message: "Project Updated Successfully", updatedProject });
});

// Delete Project
const project_delete = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new AppError("Project identifier not found", 400));
  const project = await Project.findById(id);
  if (!project) return next(new AppError("Project not found", 404));

  if (
    project.projectCreator.toString() !== req.id &&
    !["admin", "storage_admin"].includes(req.role)
  ) {
    return next(
      new AppError("You are not authorized to delete this project", 403)
    );
  }

  // Store project in recycle bin (DeletedProject)
  await DeletedProject.create({
    project: project.toObject(),
    deletedAt: new Date(),
  });

  // Remove related tasks and timeline phases
  await Promise.all([
    Project.db.model("Task").deleteMany({ _id: { $in: project.tasks } }),
    Project.db.model("Phase").deleteMany({ _id: { $in: project.timeline } }),
    Project.db
      .model("ProjectUpdate")
      .deleteMany({ _id: { $in: project.projectUpdates } }),
  ]);

  await User.findByIdAndUpdate(
    project.projectCreator,
    { $pull: { projectsId: project._id } },
    { new: true }
  );

  // Delete project from main collection
  const deletedProject = await Project.findByIdAndDelete(id);

  return res.status(200).json({
    message: "Project moved to recycle bin for 30 days",
    deletedProject,
  });
});

// Add Material to Project (supports catalog materials and designer-need custom entries)
const project_add_material = catchAsync(async (req, res, next) => {
  const { projectId } = req.query;
  const { isCustom } = req.body;

  if (!projectId) {
    return next(new AppError("Project ID is required", 400));
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  // Branch: custom designer-need entry saved to materialsList (not to materials)
  if (isCustom) {
    const { name, attributes, quantity } = req.body;

    if (!name || !quantity) {
      return next(new AppError("Material name and quantity are required", 400));
    }

    if (parseInt(quantity) < 1) {
      return next(new AppError("Quantity must be at least 1", 400));
    }

    // Ensure attributes is an object of arrays of strings
    const normalizedAttributes = {};
    if (attributes && typeof attributes === "object") {
      for (const [k, v] of Object.entries(attributes)) {
        if (!k) continue;
        const values = Array.isArray(v)
          ? v.filter(Boolean)
          : [v].filter(Boolean);
        if (values.length) normalizedAttributes[k] = values;
      }
    }

    // Always save to materialsList (designer needs), not to materials
    project.materialsList.push({
      name: name.trim(),
      attributes: Object.keys(normalizedAttributes).length
        ? normalizedAttributes
        : undefined,
      quantity: parseInt(quantity),
    });

    await project.save();

    const updatedProject = await Project.findById(projectId).populate([
      { path: "materials.material" },
    ]);

    return res.status(200).json({
      message: "Custom material added to project successfully",
      project: updatedProject,
    });
  }

  // Branch: catalog material (existing behavior)
  const { materialId, options, quantity } = req.body;

  if (!materialId || !quantity) {
    return next(new AppError("Material ID and quantity are required", 400));
  }

  const material = await Material.findById(materialId);
  if (!material) {
    return next(new AppError("Material not found", 404));
  }

  // Validate and normalize options (optional)
  let optionArray = [];
  if (options) {
    const provided = Array.isArray(options) ? options : [options];
    for (const optionValue of provided) {
      const optionToCheck =
        typeof optionValue === "string" ? optionValue : optionValue.option;
      const fullOption = material.options.find(
        (opt) => opt.option === optionToCheck
      );
      if (!fullOption) {
        return next(
          new AppError(
            `Invalid option '${optionToCheck}' for this material`,
            400
          )
        );
      }
      optionArray.push(fullOption);
    }
  }

  // Calculate total price including option prices
  let totalPrice = material.price * parseInt(quantity);
  for (const optionObj of optionArray) {
    totalPrice += optionObj.addToPrice * parseInt(quantity);
  }

  // Try to merge with existing same material+options entry
  const existingMaterialIndex = project.materials.findIndex((item) => {
    if (!item.material || item.material.toString() !== materialId) return false;
    const itemOptions = Array.isArray(item.option)
      ? item.option.map((opt) => opt.option)
      : [];
    const newOptions = optionArray.map((opt) => opt.option);
    return (
      itemOptions.length === newOptions.length &&
      itemOptions.every((opt) => newOptions.includes(opt)) &&
      newOptions.every((opt) => itemOptions.includes(opt))
    );
  });

  if (existingMaterialIndex > -1) {
    project.materials[existingMaterialIndex].quantity = parseInt(quantity);
    project.materials[existingMaterialIndex].totalPrice = totalPrice;
  } else {
    project.materials.push({
      isCustom: false,
      material: materialId,
      option: optionArray,
      quantity: parseInt(quantity),
      totalPrice,
    });
  }

  await project.save();

  const updatedProject = await Project.findById(projectId).populate([
    { path: "materials.material" },
  ]);

  return res.status(200).json({
    message: "Material added to project successfully",
    project: updatedProject,
  });
});

// Remove Material from Project
const project_remove_material = catchAsync(async (req, res, next) => {
  const { projectId } = req.query;
  const { materialId, options } = req.body;

  if (!projectId) {
    return next(new AppError("Project ID is required", 400));
  }

  if (!materialId) {
    return next(new AppError("Material ID is required", 400));
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404));
  } // Find and remove the material
  const materialIndex = project.materials.findIndex((item) => {
    if (item.material.toString() !== materialId) return false;

    // If options is provided, match options as well
    if (options) {
      const optionArray = Array.isArray(options)
        ? options.map((opt) => (typeof opt === "string" ? opt : opt.option))
        : [typeof options === "string" ? options : options.option];
      const itemOptions = Array.isArray(item.option)
        ? item.option.map((opt) => opt.option)
        : [item.option.option];

      return (
        itemOptions.length === optionArray.length &&
        itemOptions.every((opt) => optionArray.includes(opt)) &&
        optionArray.every((opt) => itemOptions.includes(opt))
      );
    }

    // If no options provided, just match material ID
    return true;
  });
  if (materialIndex === -1) {
    return next(new AppError("Material not found in project", 404));
  }

  project.materials.splice(materialIndex, 1);
  await project.save();

  const updatedProject = await Project.findById(projectId).populate([
    { path: "materials.material" },
  ]);

  return res.status(200).json({
    message: "Material removed from project successfully",
    project: updatedProject,
  });
});

// Update Material quantity in Project
const project_update_material = catchAsync(async (req, res, next) => {
  const { projectId } = req.query;
  const { materialId, options, quantity } = req.body;

  if (!projectId) {
    return next(new AppError("Project ID is required", 400));
  }

  if (!materialId || !quantity) {
    return next(new AppError("Material ID and quantity are required", 400));
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  // Get the material to calculate new total price
  const Material = require("../../models/Project/Material");
  const material = await Material.findById(materialId);
  if (!material) {
    return next(new AppError("Material not found", 404));
  } // Find the material to update
  const materialIndex = project.materials.findIndex((item) => {
    if (item.material.toString() !== materialId) return false;

    // If options is provided, match options as well
    if (options) {
      const optionArray = Array.isArray(options)
        ? options.map((opt) => (typeof opt === "string" ? opt : opt.option))
        : [typeof options === "string" ? options : options.option];
      const itemOptions = Array.isArray(item.option)
        ? item.option.map((opt) => opt.option)
        : [item.option.option];

      return (
        itemOptions.length === optionArray.length &&
        itemOptions.every((opt) => optionArray.includes(opt)) &&
        optionArray.every((opt) => itemOptions.includes(opt))
      );
    }

    // If no options provided, find first matching material
    return true;
  });

  if (materialIndex === -1) {
    return next(
      new AppError("Material with specified options not found in project", 404)
    );
  } // Calculate new total price
  const existingOptions = project.materials[materialIndex].option;
  let totalPrice = material.price * parseInt(quantity);

  if (Array.isArray(existingOptions)) {
    for (const optionObj of existingOptions) {
      totalPrice += optionObj.addToPrice * parseInt(quantity);
    }
  }

  project.materials[materialIndex].quantity = parseInt(quantity);
  project.materials[materialIndex].totalPrice = totalPrice;
  await project.save();

  const updatedProject = await Project.findById(projectId).populate([
    { path: "materials.material" },
  ]);

  return res.status(200).json({
    message: "Material quantity updated successfully",
    project: updatedProject,
  });
});

// Remove a designer-need from materialsList
const project_remove_material_list = catchAsync(async (req, res, next) => {
  const { projectId, name, index } = req.query;
  if (!projectId) return next(new AppError("Project ID is required", 400));
  const project = await Project.findById(projectId);
  if (!project) return next(new AppError("Project not found", 404));

  if (
    !Array.isArray(project.materialsList) ||
    project.materialsList.length === 0
  ) {
    return next(new AppError("No materials list to modify", 400));
  }

  let removeIndex = -1;
  if (typeof index !== "undefined") {
    const idxNum = parseInt(index, 10);
    if (
      !Number.isNaN(idxNum) &&
      idxNum >= 0 &&
      idxNum < project.materialsList.length
    ) {
      removeIndex = idxNum;
    }
  }
  if (removeIndex === -1 && name) {
    removeIndex = project.materialsList.findIndex((i) => i?.name === name);
  }
  if (removeIndex === -1)
    return next(new AppError("Item not found in materialsList", 404));

  project.materialsList.splice(removeIndex, 1);
  await project.save();

  const updatedProject = await Project.findById(projectId).populate([
    { path: "materials.material" },
  ]);

  return res.status(200).json({
    message: "Item removed from materials list",
    project: updatedProject,
  });
});

module.exports = {
  project_get,
  project_post,
  project_put,
  project_delete,
  project_add_material,
  project_remove_material,
  project_update_material,
  project_remove_material_list,
};
