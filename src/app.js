const express = require("express");
const cors = require("cors");
const passport = require("./config/passport");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const router = require("./routes/index");
const responseHandler = require("./middlewares/responseHandler");
const scheduleDailyMaintenanceTasks = require("./cron/dailyMaintenanceCron");
const paymentController = require("./controllers/paymentController");
// const scheduleMeetingReminder = require('./cron/meetingReminderScheduler');
const path = require("path");
const fs = require("fs");
const morgan = require("morgan");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Passport
app.use(passport.initialize());

const corsOptions = {
  origin: ["http://localhost:5173", "http://3.96.153.63:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

app.post(
  "/api/payments/webhook/connect",
  express.raw({ type: "application/json" }),
  paymentController.handleWebhook
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(responseHandler);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use(morgan(":method :url :status :response-time ms"));

app.use("/public", express.static(path.join(__dirname, "..", "public")));

// Initialize Passport
app.use(passport.initialize());

// Routes
app.use("/api", router);

// Start server
app.listen(PORT, async () => {
  await connectDB();
  scheduleDailyMaintenanceTasks();
  // scheduleMeetingReminder();
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: err.message,
  });
});

module.exports = app;
