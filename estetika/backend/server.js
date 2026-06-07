const path = require("path");
const dns = require("dns");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const initSocket = require("./utils/socket");
const fixNotificationIndexes = require("./utils/fixNotificationIndexes");

dotenv.config({ path: path.resolve(__dirname, ".env") });
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = require("./app");
const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGO_URI;

let server;

function shutdown(code = 1) {
  if (!server) {
    process.exit(code);
  }

  server.close(() => {
    process.exit(code);
  });
}

function logMongoConnectionHint(err) {
  if (err?.code === "ECONNREFUSED" && err?.syscall === "querySrv") {
    console.error(
      "MongoDB SRV DNS lookup failed. Check your DNS/VPN/firewall or switch to a non-SRV Atlas URI."
    );
  }
}

async function startServer() {
  if (!mongoUri) {
    console.error("Missing MONGO_URI in backend/.env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");

    // Repair stale notification indexes that silently dropped notifications as duplicates.
    await fixNotificationIndexes();

    server = app.listen(PORT, () => {
      console.log("Server Started " + PORT);
      console.log(process.env.NODE_ENV);
    });

    initSocket(server);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    logMongoConnectionHint(err);
    process.exit(1);
  }
}

process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception. Shutting down...");
  console.log(err.name, err.message, err);
  shutdown(1);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("Unhandled Rejection. Server shutting down...");
  shutdown(1);
});

startServer();
