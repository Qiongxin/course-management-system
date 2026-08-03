const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  userId: {
    type: Number,
    unique: true
  },

  firstName: {
    type: String,
    required: true
  },

  lastName: {
    type: String,
    default: ""
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  hashedPassword: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["student", "ta", "admin"]
  },

  firstLogin: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("User", userSchema);