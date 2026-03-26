const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

const userSchema = new Schema({
firstName: {
    type: String,
    required: [true, "A first name is required"],
    trim: true,
    lowercase: true
  },
  lastName: {
    type: String,
    required: [true, "A last name is required"],
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "A valid email is required"],
    unique: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    },
  },
  password: {
    type: String,
    required: [true, "A password is required"],
    validate(value) {
      if (!validator.isStrongPassword(value)) {
        throw new Error("Password be more than 6 and include characters");
      }
    },
  },
  resetToken: String,
  resetTokenExpiration: Date,
  image: {
    type: String,
  },
  country: {
    type: String,
    trim: true,
    required: [true, "Enter a country"],
  },
  affiliate: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
  },
  tokens: [
    {
      token: {
        type: String,
        required: true,
      },
    },
  ],
}, { timestamps: true });

userSchema.virtual("wallets", {
  ref: "Wallet",
  localField: "_id",
  foreignField: "owner",
});

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.tokens;

  return userObject;
};

userSchema.methods.generateAuthToken = async function () {
  const user = this;
  console.log("user", user);
  const token = jwt.sign(
    {
      _id: user._id.toString(),
    },
    process.env.JSON_SECRET_KEY,
    { expiresIn: "25m" }
  );
  console.log(user._id);

  user.tokens = user.tokens.concat({ token });
  await user.save();

  return token;
};

userSchema.statics.findByCredentials = async (email, password) => {
  let user;
  try {
    user = await User.findOne({ email, password });
    if (!user) {
      console.log("Unable to login");
    }
  } catch (error) {
   console.log(error)
  }
  return user;
};





const User = mongoose.model("User", userSchema);
module.exports = User;
