const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true,
    unique: true
  },
  termCode: {
    type: String,
    required: true
  },
  courseName: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  member: {
    type: [String],
    default: []
  }
});

module.exports = mongoose.model("Course", courseSchema);