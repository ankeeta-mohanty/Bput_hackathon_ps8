const mongoose = require('mongoose');

const subsidiarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subsidiary name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subsidiary code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Subsidiary must belong to a Group'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subsidiary', subsidiarySchema);
