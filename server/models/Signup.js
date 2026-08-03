const mongoose = require("mongoose");

const signupSheetSchema = new mongoose.Schema({
  signupID: {
    type: Number,
    unique: true,
    required: true
  },

  termCode: {
    type: String,
    required: true
  },

  section: {
    type: String,
    required: true
  },

  courseName: {
    type: String,
    required: true
  },

  assignmentName: {
    type: String,
    required: true
  },

  notBefore: {
    type: Date,
    required: true
  },

  notAfter: {
    type: Date,
    required: true
  }

});

module.exports = mongoose.model(
  "SignupSheet",
  signupSheetSchema
);