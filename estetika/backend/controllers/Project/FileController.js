const { initializeApp } = require("firebase/app");
const {
  getStorage,
  ref,
  getDownloadURL,
  uploadBytesResumable,
} = require("firebase/storage");
const AppError = require("../../utils/appError");
const catchAsync = require("../../utils/catchAsync");
const Project = require("../../models/Project/Project");
const User = require("../../models/User/User");
const Event = require("../../models/Project/Event");

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

// Upload Profile Picture
const image_post = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No image uploaded", 400));
  }

  if (!req.file.mimetype.startsWith("image/")) {
    return next(new AppError("File is not an image.", 400));
  }

  initializeApp(firebaseConfig);
  const storage = getStorage();

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const storageRef = ref(
    storage,
    `picture/${req.id}/${req.file.originalname}-${uniqueSuffix}`
  );

  const metadata = {
    contentType: req.file.mimetype,
  };

  const snapshot = await uploadBytesResumable(
    storageRef,
    req.file.buffer,
    metadata
  );

  const downloadURL = await getDownloadURL(snapshot.ref);

  if (!downloadURL) {
    return next(new AppError("Failed to upload image", 500));
  }

  const changedProfilePicture = await User.findByIdAndUpdate(
    userId,
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

  initializeApp(firebaseConfig);
  const storage = getStorage();

  const storageRef = ref(
    storage,
    `document/${projectId ? projectId : eventId}/${userId}/${
      req.file.originalname
    }`
  );

  const metadata = {
    contentType: req.file.mimetype,
  };

  const snapshot = await uploadBytesResumable(
    storageRef,
    req.file.buffer,
    metadata
  );

  const downloadURL = await getDownloadURL(snapshot.ref);

  if (projectId) {
    const addProjectFile = await Project.findByIdAndUpdate(
      projectId,
      { $push: { files: downloadURL } },
      { new: true }
    );

    if (!addProjectFile)
      return next(new AppError("Failed to add project file.", 500));
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

  const isImage = allowedImageTypes.includes(req.file.mimetype);
  const isDocument = allowedDocumentTypes.includes(req.file.mimetype);

  if (!isImage && !isDocument) {
    return next(
      new AppError(
        "File type not allowed. Only images and supported documents are allowed.",
        400
      )
    );
  }

  const userId = req.id;
  initializeApp(firebaseConfig);
  const storage = getStorage();

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const folder = isImage ? "message-images" : "message-documents";
  const storageRef = ref(
    storage,
    `${folder}/${userId}/${req.file.originalname}-${uniqueSuffix}`
  );

  const metadata = {
    contentType: req.file.mimetype,
  };

  const snapshot = await uploadBytesResumable(
    storageRef,
    req.file.buffer,
    metadata
  );

  const downloadURL = await getDownloadURL(snapshot.ref);

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

  initializeApp(firebaseConfig);
  const storage = getStorage();

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const storageRef = ref(
    storage,
    `projects/${projectId}/updates/${userId}/${req.file.originalname}-${uniqueSuffix}`
  );

  const metadata = {
    contentType: req.file.mimetype,
  };

  const snapshot = await uploadBytesResumable(
    storageRef,
    req.file.buffer,
    metadata
  );

  const downloadURL = await getDownloadURL(snapshot.ref);

  if (!downloadURL) {
    return next(new AppError("Failed to upload image", 500));
  }

  const changedProfilePicture = await User.findByIdAndUpdate(
    userId,
    { profileImage: downloadURL },
    { new: true }
  );

  if (!changedProfilePicture)
    return next(new AppError("Failed to update profile picture", 500));

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

  initializeApp(firebaseConfig);
  const storage = getStorage();

  const uploadPromises = req.files.map(async (file) => {
    if (!file.mimetype.startsWith("image/")) {
      throw new AppError("One or more files are not images.", 400);
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const storageRef = ref(
      storage,
      `materials/${userId}/${file.originalname}-${uniqueSuffix}`
    );

    const metadata = {
      contentType: file.mimetype,
    };

    const snapshot = await uploadBytesResumable(
      storageRef,
      file.buffer,
      metadata
    );

    const downloadURL = await getDownloadURL(snapshot.ref);

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

  if (!req.file) {
    return next(new AppError("No image uploaded", 400));
  }

  if (!req.file.mimetype.startsWith("image/")) {
    return next(new AppError("File is not an image.", 400));
  }

  initializeApp(firebaseConfig);
  const storage = getStorage();

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const storageRef = ref(
    storage,
    `design/${id}/${req.file.originalname}-${uniqueSuffix}`
  );

  const metadata = {
    contentType: req.file.mimetype,
  };

  const snapshot = await uploadBytesResumable(
    storageRef,
    req.file.buffer,
    metadata
  );

  const downloadURL = await getDownloadURL(snapshot.ref);

  if (!downloadURL) {
    return next(new AppError("Failed to upload image", 500));
  }

  return res.status(200).json({
    message: "Design Picture Successfully Uploaded!",
    imageLink: downloadURL,
  });
});

// In fetch_csv, use dynamic import if fetch is not defined
const fetch_csv = catchAsync(async (req, res) => {
  const { url } = req.query;
  if (!url) return next(new AppError("URL not provided", 400));
  if (!fetch) fetch = (await import("node-fetch")).default;
  const response = await fetch(url);
  const text = await response.text();
  res.set("Content-Type", "text/csv");
  return res.send(text);
});

module.exports = {
  image_post,
  document_post,
  message_file_post,
  update_image_post,
  material_image_post,
  fetch_csv,
  design_image_post,
};
