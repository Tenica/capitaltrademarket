const path = require("path");
const fs = require("fs");
const dotenv = require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cors = require("cors")
const { processDailyProfitsInternal } = require("./controllers/investments");

const MONGODB_URI = process.env.MONGODB_URL;

const fileStorage = multer.diskStorage({
  destination: process.env.VERCEL ? "/tmp" : "./images/",

  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const app = express();
app.use(cors());

const port = process.env.PORT || 4000;

// Require and use the routes
const userAuthRoute = require("./routes/auth");
const invoiceRoute = require("./routes/invoice");
const systemWalletRoute = require("./routes/system-wallet");
const planRoute = require("./routes/plan.js");
const pendingConfirmationRoute = require("./routes/pending-confirmation");
const withdrawalRoute = require("./routes/withdrawals.js");
const investmentRoute = require("./routes/investments.js");
const walletRoute = require("./routes/wallet.js")
const transactionsRoute = require("./routes/transactions.js");
const historyRoute = require("./routes/history");

app.use(compression());

if (process.env.VERCEL) {
  app.use(morgan('combined')); // Log to Vercel dashboard instead of file
} else {
  const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), {flags: 'a'})
  app.use(morgan('combined', {stream: accessLogStream}))
}

app.use(bodyParser.json());

app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/images", express.static(process.env.VERCEL ? "/tmp" : path.join(__dirname, "images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// MongoDB Connection Configuration & Optimization for Vercel
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    console.log("Connecting to MongoDB...");
    const db = await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 10000, // 10s connection timeout
    });
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed!");
    if (error.message.includes("ETIMEOUT") || error.message.includes("ECONNREFUSED")) {
      console.error("  TIP: This is likely a Network/IP Whitelisting issue in MongoDB Atlas.");
      console.error("  ACTION: Ensure 0.0.0.0/0 is allowed in Atlas > Network Access.");
    }
    throw error;
  }
};

// Initial connection attempt
connectDB().catch(err => console.error("Initial DB connection failed:", err.message));

// Ensure DB is connected before handling any request (Prevents Mongoose buffering timeout)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({ 
      message: "Database connection unavailable. Please ensure your IP is whitelisted in MongoDB Atlas.",
      error: error.message 
    });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "CapitalTradeMarkets API is running successfully!",
    status: "online",
    database: isConnected ? "connected" : "disconnected"
  });
});

app.use("/auth", userAuthRoute);
app.use("/invoice", invoiceRoute);
app.use("/system-wallet", systemWalletRoute);
app.use("/plan", planRoute)
app.use("/pending-confirmation", pendingConfirmationRoute)
app.use("/withdrawal", withdrawalRoute)
app.use("/investment", investmentRoute)
app.use("/wallet", walletRoute)
app.use("/transactions", transactionsRoute)
app.use("/history", historyRoute)

// Port binding is only for local development
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server running locally on port ${port}`);
  });
}

// Export the Express API for Vercel
module.exports = app;
