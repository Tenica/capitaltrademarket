const mongoose = require("mongoose");
const User = require("../model/user");
const Referral = require("../model/referral");
const Wallet = require("../model/wallet");
const isAuth = require("../middleware/is-auth");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

const { errorMonitor } = require("events");
const { generateRandomToken } = require("../util/helper-functions");
const { passwordResetEmail, welcomeEmail } = require("../util/email");




exports.createUser = async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    password,
    country
  } = req.body;

  const { referral } = req.body


  const user = new User({
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    country: country,
    affiliate: generateRandomToken(),
  });



  let checkAffiliate;


  try {
    const userEmail = await User.findOne({ email: email });
    referral === undefined ? '' : checkAffiliate = await User.findOne({ affiliate: referral });

    if (userEmail) {
      res
        .status(401)
        .json({
          message: "E-mail exists already, please pick a different one.",
        });
    } else if (referral !== undefined && checkAffiliate === null) {
      return res
        .status(402)
        .json({
          message: "Referrer doesn't exist, kindly put in the right code or contact your referrer",
        });

    } else {
      const saveUser = await user.save();
      const getUserToken = await user.generateAuthToken();
      console.log(saveUser);
      if (referral !== undefined && checkAffiliate !== null) {
        const getReferral = new Referral({
          affiliateId: checkAffiliate?._id,
          affiliateEmail: checkAffiliate?.email,
          userEmail: saveUser?.email,
          user: saveUser._id,
        });

        const saveReferral = await getReferral.save();
        console.log(saveReferral);
      }
      const wallet = new Wallet({
        currencyType: "Dollar",
        owner: saveUser._id
      })
      const initialWallet = await wallet.save();
      console.log(initialWallet);

      // Send Welcome Email
      await welcomeEmail(saveUser.firstName, saveUser.email);

      res.status(200).json({ message: `Hello ${saveUser.lastName} thanks for joining us, kindly log into your account` });

    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: error.message || error });
  }
};

exports.adminCreateUser = async (req, res, next) => {
  if (!req.user?.isAdmin) return res.status(403).json({ message: "Forbidden: Admin access only" });

  const {
    firstName,
    lastName,
    email,
    password,
    country,
    isAdmin = false,
    isBlocked = false,
    referral
  } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      country,
      isAdmin,
      isBlocked,
      affiliate: generateRandomToken()
    });

    let checkAffiliate = null;
    if (referral) {
      checkAffiliate = await User.findOne({ affiliate: referral });
      if (!checkAffiliate) {
        return res.status(400).json({ message: "Referrer not found" });
      }
    }

    const savedUser = await user.save();

    if (checkAffiliate) {
      const newReferral = new Referral({
        affiliateId: checkAffiliate._id,
        affiliateEmail: checkAffiliate.email,
        userEmail: savedUser.email,
        user: savedUser._id
      });
      await newReferral.save();
    }

    const wallet = new Wallet({
      currencyType: "Dollar",
      owner: savedUser._id
    });
    await wallet.save();

    res.status(201).json({
      message: "User created successfully by admin",
      user: {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        isAdmin: savedUser.isAdmin
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || "Error creating user" });
  }
};



exports.logUser = async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );
    if (!user) {
      return res.status(401).json({ message: "User not found!" })
    }

    if (user.isBlocked) {
      return res.status(403).json({ message: `Hello ${user.firstName}, please contact the admin.` })
    }

    if (user.isTwoFactorEnabled) {
      return res.status(200).json({ require2Fa: true, userId: user._id });
    }

    const token = await user.generateAuthToken();
    res.send({ user, token })
  } catch (error) {
    res.status(501).json({ error: error.message || error })
    console.log(error)
  }
};

exports.logoutUser = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).json({ message: e.message || e });
    console.log(e);
  }
};

exports.postReset = (req, res, next) => {
  const encryptPassword = crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      console.log(err);
      return res.status(500).send(err);
    }
    const passToken = buffer.toString("hex");
    const findUser = await User.findOne({ email: req.body.email })
    try {
      if (!findUser) {
        res.status(400).json({ message: "No account" });
      } else {
        findUser.resetToken = passToken;
        findUser.resetTokenExpiration = Date.now() + 3600000;
        const result = await findUser.save();
        passwordResetEmail(result.firstName, result.resetToken, result.email)
        console.log(req.body.email, result);
        res.status(200).json({ message: `${findUser.firstName}, kindly check your email to continue` });
      }
    } catch (error) {
      console.log(error);
    }
  });
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      res
        .status(200)
        .json({ userId: user._id.toString(), passwordToken: token });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postNewPassword = async (req, res, next) => {
  const token = req.params.token;
  const newPassword = req.body.password;
  // const userId = req.body.userId;
  // const passwordToken = req.body.passwordToken;
  // console.log(passwordToken);
  let resetUser;

  try {
    const result = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }
      // _id: userId,
    })

    if (result) {
      resetUser = result;
      resetUser.password = newPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      const saveResult = await resetUser.save();
      return res.status(200).json({ message: `Password successfully set` })
    } else {
      res.status(400).json({ message: "user not found" })
    }
  } catch (error) {
    console.error(error);
    res.status(402).json({ message: error.message || "An unexpected error occurred" })
  }
};

exports.getAllUsers = async (req, res) => {
  if (!req.user?.isAdmin) return res.status(401).json({ message: "Unauthorized" });
  try {
    const users = await User.find({}, '-password -tokens -resetToken -resetTokenExpiration');
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

exports.blockUser = async (req, res) => {
  if (!req.user?.isAdmin) return res.status(401).json({ message: "Unauthorized" });
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: `${user.firstName} has been blocked.` });
  } catch (error) {
    res.status(500).json({ message: "Error blocking user" });
  }
};

exports.unblockUser = async (req, res) => {
  if (!req.user?.isAdmin) return res.status(401).json({ message: "Unauthorized" });
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: `${user.firstName} has been unblocked.` });
  } catch (error) {
    res.status(500).json({ message: "Error unblocking user" });
  }
};

exports.generate2FaSecret = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const secret = speakeasy.generateSecret({
      name: `CapitalTradeMarkets (${user.email})`
    });

    user.twoFactorSecret = secret.base32;
    await user.save();

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) return res.status(500).json({ message: "Error generating QR Code" });
      res.status(200).json({
        secret: secret.base32,
        qrCodeUrl: data_url
      });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

exports.verifyAndEnable2Fa = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token
    });

    if (verified) {
      user.isTwoFactorEnabled = true;
      await user.save();
      return res.status(200).json({ message: "2FA successfully enabled!" });
    } else {
      return res.status(400).json({ message: "Invalid Authenticator code. Try again." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

exports.verifyLogin2Fa = async (req, res) => {
  try {
    const { userId, token } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token
    });

    if (verified) {
      const authToken = await user.generateAuthToken();
      res.status(200).json({ user, token: authToken });
    } else {
      res.status(400).json({ message: "Invalid Authenticator code" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message || "Server Error" });
  }
};
