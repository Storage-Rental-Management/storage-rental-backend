const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const oauthRoutes = require('./routes/oauthRoutes');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const router = require('./routes/index');
const responseHandler = require('./middlewares/responseHandler');


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Passport
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

// Middleware
app.use(passport.initialize());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(responseHandler);

// Routes
app.use("/api", router);

// Start server
app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: err.message
    });
});

module.exports = app;
