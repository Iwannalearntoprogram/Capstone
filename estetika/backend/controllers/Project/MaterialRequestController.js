const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const MaterialRequest = require("../../models/Project/MaterialRequest");
const Project = require("../../models/Project/Project");
const notifyMany = require("../../utils/notifyMany");
const User = require("../../models/User/User");

const toTitleCase = (s) =>
  typeof s === "string"
    ? s
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : s;

// Designers submit new material request for a project
const request_post = catchAsync(async (req, res, next) => {
  const { projectId, category, attributes, budgetMax, notes } = req.body;
  const requestedBy = req.id;

  if (!projectId || !category) {
    return next(new AppError("projectId and category are required.", 400));
  }

  const project = await Project.findById(projectId);
  if (!project) return next(new AppError("Project not found.", 404));

  // Convert attributes object { key: [values] } to array [{ key, values }]
  let attributesArray = [];
  if (attributes && typeof attributes === "object") {
    attributesArray = Object.entries(attributes)
      .filter(
        ([key, values]) => key && Array.isArray(values) && values.length > 0
      )
      .map(([key, values]) => ({
        key: toTitleCase(key),
        values: values.map((v) => toTitleCase(v)),
      }));
  }

  const doc = await MaterialRequest.create({
    projectId,
    requestedBy,
    category: toTitleCase(category),
    attributes: attributesArray,
    budgetMax,
    notes,
  });

  // notify storage_admins
  try {
    const admins = await User.find({ role: "storage_admin" }).select("_id");
    if (admins?.length) {
      await notifyMany(
        admins.map((a) => ({
          recipient: a._id,
          message: `New material request for project "${
            project.title
          }": ${toTitleCase(category)}`,
          type: "update",
          project: project._id,
        }))
      );
    }
  } catch (e) {
    console.warn("Notify storage_admin failed:", e?.message);
  }

  return res
    .status(200)
    .json({ message: "Material request submitted", request: doc });
});

// storage_admin: list requests (optionally filter by status)
const request_get = catchAsync(async (req, res, next) => {
  const { status, projectId, mine } = req.query;
  const q = {};
  if (status) q.status = status;
  if (projectId) q.projectId = projectId;
  if (mine === "true") q.requestedBy = req.id;
  const requests = await MaterialRequest.find(q)
    .populate("requestedBy", "fullName firstName lastName role")
    .populate("projectId", "title");
  return res.status(200).json({ message: "Requests fetched", requests });
});

// storage_admin: approve/decline request (with optional material linkage)
const request_put = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  const { status, materialId } = req.body; // approved|declined
  if (!id) return next(new AppError("Request id is required", 400));
  if (!status || !["approved", "declined"].includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  const update = { status };
  if (status === "approved") {
    update.approvedAt = new Date();
    update.approvedBy = req.id;
    if (materialId) update.materialId = materialId;
  } else if (status === "declined") {
    update.declinedAt = new Date();
    update.declinedBy = req.id;
  }

  const updated = await MaterialRequest.findByIdAndUpdate(id, update, {
    new: true,
  })
    .populate("requestedBy", "fullName firstName lastName role")
    .populate("projectId", "title")
    .populate("materialId", "name category price");
  if (!updated) return next(new AppError("Request not found", 404));

  // notify requester
  try {
    await notifyMany([
      {
        recipient: updated.requestedBy?._id || updated.requestedBy,
        message:
          status === "approved"
            ? `Your material request for "${updated.category}" was approved.`
            : `Your material request for "${updated.category}" was declined.`,
        type: "update",
        project: updated.projectId?._id || updated.projectId,
        material: updated.materialId?._id || updated.materialId || undefined,
      },
    ]);
  } catch {}

  return res.status(200).json({ message: "Request updated", request: updated });
});

module.exports = { request_post, request_get, request_put };
