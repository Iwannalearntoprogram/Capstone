const { initializeApp, getApps } = require("firebase/app");
const { getStorage, ref, deleteObject } = require("firebase/storage");
const { v2: cloudinary } = require("cloudinary");
const path = require("path");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const Project = require("../../models/Project/Project");
const User = require("../../models/User/User");
const Event = require("../../models/Project/Event");
const notifyMany = require("../../utils/notifyMany");

// Use dynamic import for node-fetch ESM compatibility
let fetch;
(async () => {
  fetch = (await import("node-fetch")).default;
})();

const allowedDocumentTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "application/csv",
  "text/plain",
];

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const firebaseConfig = {
  storageBucket: process.env.FIREBASE_STORAGEBUCKET,
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const assertCloudinaryConfig = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new AppError(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
      500
    );
  }
};

const getFirebaseStorage = () => {
  if (!process.env.FIREBASE_STORAGEBUCKET) {
    throw new AppError("Firebase storage bucket is not configured.", 500);
  }

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }

  return getStorage();
};

const sanitizePublicIdPart = (value) =>
  path
    .parse(value || "upload")
    .name.replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "upload";

const getCloudinaryResourceType = (file, fallback = "auto") => {
  if (file.mimetype?.startsWith("image/")) return "image";
  if (fallback !== "auto") return fallback;
  return "raw";
};

const uploadToCloudinary = async (file, folder, options = {}) => {
  assertCloudinaryConfig();

  const resourceType = getCloudinaryResourceType(
    file,
    options.resourceType || "auto"
  );
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const extension = path.extname(file.originalname || "");
  const baseName = sanitizePublicIdPart(file.originalname);
  const publicId =
    resourceType === "raw"
      ? `${baseName}-${uniqueSuffix}${extension}`
      : `${baseName}-${uniqueSuffix}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url) {
          return reject(new AppError("Failed to upload file", 500));
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const parseCloudinaryUrl = (fileUrl) => {
  const parsedUrl = new URL(fileUrl);
  if (!parsedUrl.hostname.includes("res.cloudinary.com")) return null;

  const parts = parsedUrl.pathname.split("/").filter(Boolean);
  const resourceType = parts[1];
  const uploadIndex = parts.indexOf("upload");
  if (!resourceType || uploadIndex === -1) return null;

  const publicPathParts = parts.slice(uploadIndex + 1);
  if (publicPathParts[0] && /^v\d+$/.test(publicPathParts[0])) {
    publicPathParts.shift();
  }

  let publicId = decodeURIComponent(publicPathParts.join("/"));
  if (resourceType !== "raw") {
    publicId = publicId.replace(/\.[^/.]+$/, "");
  }

  return { publicId, resourceType };
};

const deleteFromStorage = async (fileUrl) => {
  const cloudinaryFile = parseCloudinaryUrl(fileUrl);

  if (cloudinaryFile) {
    assertCloudinaryConfig();
    await cloudinary.uploader.destroy(cloudinaryFile.publicId, {
      resource_type: cloudinaryFile.resourceType,
    });
    return;
  }

  const storage = getFirebaseStorage();
  const url = new URL(fileUrl);
  const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);

  if (!pathMatch) {
    throw new AppError("Unsupported storage URL format", 400);
  }

  const filePath = decodeURIComponent(pathMatch[1]);
  const fileRef = ref(storage, filePath);
  await deleteObject(fileRef);
};

// Upload Profile Picture
const image_post = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No image uploaded", 400));
  }

  if (!req.file.mimetype.startsWith("image/")) {
    return next(new AppError("File is not an image.", 400));
  }

  const downloadURL = await uploadToCloudinary(req.file, `picture/${req.id}`, {
    resourceType: "image",
  });

  if (!downloadURL) {
    return next(new AppError("Failed to upload image", 500));
  }

  const changedProfilePicture = await User.findByIdAndUpdate(
    req.id,
    { profileImage: downloadURL },
    { new: true }
  );

  if (!changedProfilePicture)
    return next(new AppError("Failed to update profile picture", 500));

  return res.status(200).json({
    message: "Profile Picture Successfully Uploaded!",
    imageLink: downloadURL,
  });
});

// Upload Document
const document_post = catchAsync(async (req, res, next) => {
  const { projectId, eventId } = req.query;

  if (!projectId && !eventId)
    return next(new AppError("Identifier not found", 400));

  if (projectId) {
    const isProjectValid = await Project.findById(projectId);
    if (!isProjectValid)
      return next(new AppError("Project not found. Invalid Project ID.", 404));
  } else {
    const isEventValid = await Event.findById(eventId);
    if (!isEventValid)
      return next(new AppError("Event not found. Invalid Event ID.", 404));
  }

  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  if (!allowedDocumentTypes.includes(req.file.mimetype)) {
    return next(
      new AppError(
        "File is not a supported document type. Allowed types are PDF, Word, Excel, PowerPoint, CSV.",
        400
      )
    );
  }

  const userId = req.id;

  const downloadURL = await uploadToCloudinary(
    req.file,
    `document/${projectId ? projectId : eventId}/${userId}`,
    { resourceType: "raw" }
  );

  if (projectId) {
    const addProjectFile = await Project.findByIdAndUpdate(
      projectId,
      { $push: { files: downloadURL } },
      { new: true }
    );

    if (!addProjectFile)
      return next(new AppError("Failed to add project file.", 500));

    // Notify members, creator, admins about new file upload
    try {
      const project = await Project.findById(projectId).populate(
        "members projectCreator"
      );
      const User = require("../../models/User/User");
      const Notification = require("../../models/utils/Notification");
      const admins = await User.find({
        role: { $in: ["admin", "storage_admin"] },
      }).select("_id");
      const recipients = [
        ...(Array.isArray(project?.members)
          ? project.members.map((m) => m._id || m)
          : []),
        project?.projectCreator?._id || project?.projectCreator,
        ...admins.map((a) => a._id),
      ].filter(Boolean);
      const unique = [...new Set(recipients.map(String))];
      if (unique.length) {
        await notifyMany(
          unique.map((rid) => ({
            recipient: rid,
            message: `A new file was uploaded to project "${project?.title}"`,
            type: "update",
            project: project?._id,
          }))
        );
      }
    } catch (e) {
      // non-blocking
      console.error("Notification fan-out failed (file upload):", e?.message);
    }
  } else {
    const addEventFile = await Event.findByIdAndUpdate(
      eventId,
      { file: downloadURL },
      { new: true }
    );

    if (!addEventFile)
      return next(new AppError("Failed to add event file.", 500));
  }

  return res.status(200).json({
    message: `Document Successfully Uploaded to ${
      projectId ? "Project" : "Event"
    }!`,
    documentLink: downloadURL,
  });
});

const message_file_post = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  const userId = req.id;
  const downloadURL = await uploadToCloudinary(
    req.file,
    `message-files/${userId}`
  );

  if (!downloadURL) {
    return next(new AppError("Failed to upload file", 500));
  }

  return res.status(200).json({
    message: "File uploaded successfully!",
    fileLink: downloadURL,
    fileType: req.file.mimetype,
  });
});

const update_image_post = catchAsync(async (req, res, next) => {
  const { projectId } = req.query;

  if (!req.file) {
    return next(new AppError("No file uploaded", 400));
  }

  if (!projectId) {
    return next(new AppError("Project ID not found", 400));
  }

  const isProjectValid = await Project.findById(projectId);

  if (!isProjectValid) {
    return next(new AppError("Project not found. Invalid Project ID.", 404));
  }

  if (!req.file.mimetype.startsWith("image/")) {
    return next(new AppError("File is not an image.", 400));
  }

  const userId = req.id;

  const downloadURL = await uploadToCloudinary(
    req.file,
    `projects/${projectId}/updates/${userId}`,
    { resourceType: "image" }
  );

  if (!downloadURL) {
    return next(new AppError("Failed to upload image", 500));
  }

  // Just return the image URL - don't update user's profile picture
  return res.status(200).json({
    message: "Project Update Picture Successfully Uploaded!",
    imageLink: downloadURL,
  });
});

const material_image_post = catchAsync(async (req, res, next) => {
  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    return next(new AppError("No files uploaded", 400));
  }

  const userId = req.id;

  const uploadPromises = req.files.map(async (file) => {
    if (!file.mimetype.startsWith("image/")) {
      throw new AppError("One or more files are not images.", 400);
    }

    const downloadURL = await uploadToCloudinary(file, `materials/${userId}`, {
      resourceType: "image",
    });

    if (!downloadURL) {
      throw new AppError("Failed to upload one of the material images", 500);
    }

    return downloadURL;
  });

  let imageLinks;
  try {
    imageLinks = await Promise.all(uploadPromises);
  } catch (err) {
    return next(err);
  }

  // Optionally, update the material's image field in your DB here if needed

  return res.status(200).json({
    message: "Material Images Successfully Uploaded!",
    imageLink: imageLinks,
  });
});

const design_image_post = catchAsync(async (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return next(new AppError("Design ID not provided", 400));
  }

  if (!req.file) {
    return next(new AppError("No image uploaded", 400));
  }

  if (!req.file.mimetype.startsWith("image/")) {
    return next(new AppError("File is not an image.", 400));
  }

  const downloadURL = await uploadToCloudinary(req.file, `design/${id}`, {
    resourceType: "image",
  });

  if (!downloadURL) {
    return next(new AppError("Failed to upload image", 500));
  }

  return res.status(200).json({
    message: "Design Picture Successfully Uploaded!",
    imageLink: downloadURL,
  });
});

const carousel_image_post = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No image uploaded", 400));
  }

  if (!req.file.mimetype.startsWith("image/")) {
    return next(new AppError("File is not an image.", 400));
  }

  const userId = req.id;

  const downloadURL = await uploadToCloudinary(
    req.file,
    `mobile-carousel/${userId}`,
    { resourceType: "image" }
  );

  if (!downloadURL) {
    return next(new AppError("Failed to upload image", 500));
  }

  return res.status(200).json({
    message: "Carousel Image Successfully Uploaded!",
    imageLink: downloadURL,
  });
});

// In fetch_csv, use dynamic import if fetch is not defined
const fetch_csv = catchAsync(async (req, res, next) => {
  const { url } = req.query;
  if (!url) return next(new AppError("URL not provided", 400));
  if (!fetch) fetch = (await import("node-fetch")).default;
  const response = await fetch(url);
  const text = await response.text();
  res.set("Content-Type", "text/csv");
  return res.send(text);
});

// Delete File
const file_delete = catchAsync(async (req, res, next) => {
  const { projectId } = req.query;
  const { fileUrl } = req.body;

  if (!projectId) {
    return next(new AppError("Project ID not provided", 400));
  }

  if (!fileUrl) {
    return next(new AppError("File URL not provided", 400));
  }

  // Check if project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError("Project not found", 404));
  }

  // Authorization: allow if project owner, admin, or storage_admin
  if (
    project.projectCreator?.toString() !== req.id &&
    !["admin", "storage_admin"].includes(req.role)
  ) {
    return next(
      new AppError(
        "You are not authorized to delete files for this project",
        403
      )
    );
  }

  // Check if file exists in project files array
  if (!project.files || !project.files.includes(fileUrl)) {
    return next(new AppError("File not found in project", 404));
  }

  await deleteFromStorage(fileUrl);

  // Remove file URL from project's files array
  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    { $pull: { files: fileUrl } },
    { new: true }
  );

  if (!updatedProject) {
    return next(new AppError("Failed to update project", 500));
  }

  return res.status(200).json({
    status: "success",
    message: "File successfully deleted",
    data: {
      project: updatedProject,
    },
  });
});

module.exports = {
  image_post,
  document_post,
  message_file_post,
  update_image_post,
  material_image_post,
  fetch_csv,
  design_image_post,
  carousel_image_post,
  file_delete,
};
