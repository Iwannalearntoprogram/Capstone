const express = require("express");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const cron = require("node-cron");
const passport = require("./config/passport");
const session = require("express-session");

// routes import
// user
const authRoute = require("./routes/User/authRoute");
const muteRoute = require("./routes/User/muteRoute");
const userRoute = require("./routes/User/userRoute");
const messageRoute = require("./routes/User/messageRoute");
const markReadRoute = require("./routes/User/markReadRoute");
const conversationRoute = require("./routes/User/conversationRoute");

// project
const eventRoute = require("./routes/Project/eventRoute");
const fileRoute = require("./routes/Project/fileRoute");
const materialRoute = require("./routes/Project/materialRoute");
const materialRequestRoute = require("./routes/Project/materialRequestRoute");
const categoryTemplateRoute = require("./routes/Project/categoryTemplateRoute");
const attributeRegistryRoute = require("./routes/Project/attributeRegistryRoute");
const phaseRoute = require("./routes/Project/phaseRoute");
const projectRoute = require("./routes/Project/projectRoute");
const taskRoute = require("./routes/Project/taskRoute");
const ratingRoute = require("./routes/Project/ratingRoute");

// utility
const aliveRoute = require("./routes/utils/aliveRoute");
const mobileHomeContentRoute = require("./routes/utils/mobileHomeContentRoute");
const AppError = require("./utils/appError");
const checkAuth = require("./utils/checkAuth");
const { expressCorsOptions } = require("./utils/cors");
const globalErrorHandler = require("./controllers/utils/ErrorController");
const {
  checkEventAlarms,
  checkOverdueTasks,
  checkPhaseStart,
  checkPhaseCompletion,
} = require("./utils/cronJobNotification");

// initializations
const app = express();
app.set("trust proxy", 1);
const downloadsDir = path.resolve(__dirname, "public", "downloads");

const limiter = rateLimit({
  max: 1000,
  windowMs: 10 * 60, // 1 minute
  message: "Too many requests, please try again later.",
});

// middlewares
app.use(helmet()); // ensures secure web application by setting various HTTP headers
app.use(
  express.json({
    limit: "10kb",
  })
); // Body Parser
app.use(hpp()); // prevent paramater pollution
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cors(expressCorsOptions)); // Cross Origin Resource Sharing
app.use(express.json());
app.use(express.urlencoded());
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "geolocation=(self), camera=()");
  next();
});
app.use("/api", limiter); //Protection Against DDOS Attack

// APK download — redirect to the GitHub Releases-hosted binary.
// The APK (~106MB) is too large to ship in the repo. It was previously Git LFS,
// which Render does not fetch on deploy, so /downloads/Moss.apk returned 404.
// We now attach Moss.apk to a GitHub Release; the "latest" URL below always
// resolves to the most recent release's asset. Override with APK_DOWNLOAD_URL.
const APK_DOWNLOAD_URL =
  process.env.APK_DOWNLOAD_URL ||
  "https://github.com/Iwannalearntoprogram/Capstone/releases/latest/download/Moss.apk";

app.get("/downloads/Moss.apk", (req, res) => {
  return res.redirect(302, APK_DOWNLOAD_URL);
});

// Static file serving for any other downloads
app.use(
  "/downloads",
  express.static(downloadsDir, {
    setHeaders(res, filePath) {
      if (path.extname(filePath).toLowerCase() === ".apk") {
        res.setHeader("Content-Type", "application/vnd.android.package-archive");
        res.setHeader("Content-Disposition", "attachment");
      }
    },
  })
);
app.use(
  "/material-images",
  express.static(path.resolve(__dirname, "..", "..", "Materials"))
);

// routes
// user
app.use("/api/auth", authRoute);
app.use("/api/user", checkAuth, muteRoute);
app.use("/api/user", checkAuth, userRoute);
app.use("/api/message", checkAuth, messageRoute);
app.use("/api/message", checkAuth, markReadRoute);
app.use("/api/conversation", checkAuth, conversationRoute);

// project
app.use("/api/event", checkAuth, eventRoute);
app.use("/api/upload", checkAuth, fileRoute);
app.use("/api/material", checkAuth, materialRoute);
app.use("/api/material-request", checkAuth, materialRequestRoute);
app.use("/api/category-template", checkAuth, categoryTemplateRoute);
app.use("/api/attribute-registry", checkAuth, attributeRegistryRoute);
app.use("/api/phase", checkAuth, phaseRoute);
app.use("/api/project", checkAuth, projectRoute);
app.use("/api/task", checkAuth, taskRoute);
app.use("/api/rating", ratingRoute);

// utility
app.use("/api/alive", aliveRoute);
app.use("/api/mobile-home-content", mobileHomeContentRoute);

// route catch
app.all("/{*splat}", (req, res, next) => {
  console.log(`Can't find ${req.originalUrl} on this server!`);
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

// cron job
cron.schedule("0 * * * *", () => {
  checkEventAlarms();
  checkOverdueTasks();
  checkPhaseStart();
  checkPhaseCompletion();
});

module.exports = app;
