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
const cron = require("node-cron");
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

app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "CapitalTradeMarkets API is running successfully!",
    status: "online"
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

mongoose
  .connect(MONGODB_URI)
  .then((result) => {
    app.listen(port);
    console.log(`Server running on port ${port}`);

    // Schedule: Run daily profit processing every midnight (00:00)
    cron.schedule("0 0 * * *", async () => {
      console.log("[Cron Job] Starting daily profit processing...");
      try {
        const result = await processDailyProfitsInternal();
        console.log(`[Cron Job] Finished. Processed ${result.processedCount} investments.`);
      } catch (err) {
        console.error("[Cron Job] Failed during automatic payout:", err);
      }
    });

  })
  .catch((err) => {
    console.log(err);
  });

// Export the Express API for Vercel Serverless Functions
module.exports = app;
