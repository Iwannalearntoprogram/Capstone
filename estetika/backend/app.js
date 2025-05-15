const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const hpp = require("hpp");

// routes import
// user
const authRoute = require("./routes/User/authRoute");

// project
const eventRoute = require("./routes/Project/eventRoute");
const fileRoute = require("./routes/Project/fileRoute");
const materialRoute = require("./routes/Project/materialRoute");
const phaseRoute = require("./routes/Project/phaseRoute");
const projectRoute = require("./routes/Project/projectRoute");
const subPhaseRoute = require("./routes/Project/subPhaseRoute");
const taskRoute = require("./routes/Project/taskRoute");

// utility
const aliveRoute = require("./routes/aliveRoute");
const AppError = require("./utils/appError");
const checkAuth = require("./utils/checkAuth");
const globalErrorHandler = require("./controllers/ErrorController");

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
app.use(cors()); // Cross Origin Resource Sharing
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

// project
app.use("/api/event", checkAuth, eventRoute);
app.use("/api/upload", checkAuth, fileRoute);
app.use("/api/material", checkAuth, materialRoute);
app.use("/api/phase", checkAuth, phaseRoute);
app.use("/api/project", checkAuth, projectRoute);
app.use("/api/subphase", checkAuth, subPhaseRoute);
app.use("/api/task", checkAuth, taskRoute);

// utility
app.use("/api/alive", aliveRoute);

// route catch
app.all("/{*splat}", (req, res, next) => {
  console.log(req.originalUrl);
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
