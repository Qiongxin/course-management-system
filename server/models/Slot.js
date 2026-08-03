const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    grade: {
      type: Number,
      default: 0
    },
    bonus: {
      type: Number,
      default: 0
    },
    penalty: {
      type: Number,
      default: 0
    },
    comment: {
      type: String,
      default: ""
    },
    gradedBy: {
      type: String
    },
    gradedTime: {
      type: Number
    }
  },
  { _id: false }
);

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true
    },

    grade: {
      type: Number,
      default: 0
    },

    bonus: {
      type: Number,
      default: 0
    },

    penalty: {
      type: Number,
      default: 0
    },

    comment: {
      type: String,
      default: ""
    },

    gradedBy: {
      type: Number
    },

    gradedTime: {
      type: Number
    },

    history: {
      type: [historySchema],
      default: []
    }
  },
  { _id: false }
);

const slotSchema = new mongoose.Schema({
  signupID: {
    type: Number,
    required: true
  },

  slotID: {
    type: Number,
    required: true,
    unique: true
  },

  start: {
    type: Number,
    required: true
  },

  slotDuration: {
    type: Number,
    required: true
  },

  maxMembers: {
    type: Number,
    required: true
  },

  members: {
    type: [memberSchema],
    default: []
  }
});

module.exports = mongoose.model("Slot", slotSchema);