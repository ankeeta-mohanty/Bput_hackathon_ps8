const mongoose = require('mongoose');

const projectSiteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Project site name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Project site code is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    location: {
      type: String,
      required: [true, 'Project site location is required'],
      trim: true,
    },
    subsidiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subsidiary',
      required: [true, 'Project site must belong to a Subsidiary'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProjectSite', projectSiteSchema);
