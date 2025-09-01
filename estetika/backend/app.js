const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");
const cron = require("node-cron");

// routes import
// user
const authRoute = require("./routes/User/authRoute");
const userRoute = require("./routes/User/userRoute");
const messageRoute = require("./routes/User/messageRoute");

// project
const eventRoute = require("./routes/Project/eventRoute");
const fileRoute = require("./routes/Project/fileRoute");
const materialRoute = require("./routes/Project/materialRoute");
const phaseRoute = require("./routes/Project/phaseRoute");
const projectRoute = require("./routes/Project/projectRoute");
const taskRoute = require("./routes/Project/taskRoute");
const ratingRoute = require("./routes/Project/ratingRoute");

// utility
const aliveRoute = require("./routes/utils/aliveRoute");
const mobileHomeContentRoute = require("./routes/utils/mobileHomeContentRoute");
const AppError = require("./utils/appError");
const checkAuth = require("./utils/checkAuth");
const globalErrorHandler = require("./controllers/utils/ErrorController");
const {
  checkEventAlarms,
  checkOverdueTasks,
  checkPhaseStart,
} = require("./utils/cronJobNotification");

// initializations
const app = express();
app.set("trust proxy", 1);

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
  cors({
    origin: [process.env.CLIENT_URL, "http://localhost:5173"],
    credentials: true,
  })
); // Cross Origin Resource Sharing
app.use(express.json());
app.use(express.urlencoded());
app.use((req, res, next) => {
  res.setHeader("Permissions-Policy", "geolocation=(self), camera=()");
  next();
});
app.use("/api", limiter); //Protection Against DDOS Attack

// routes
// user
app.use("/api/auth", authRoute);
app.use("/api/user", checkAuth, userRoute);
app.use("/api/message", checkAuth, messageRoute);

// project
app.use("/api/event", checkAuth, eventRoute);
app.use("/api/upload", checkAuth, fileRoute);
app.use("/api/material", checkAuth, materialRoute);
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
});

module.exports = app;
