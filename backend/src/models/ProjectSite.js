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
    provenance: {
      sourceType: {
        type: String,
        enum: ['official_corporate_filing', 'authorized_site_register', 'sample_seed_unverified'],
        default: 'sample_seed_unverified',
      },
      verified: { type: Boolean, default: false },
      sourceReference: { type: String, default: 'Prototype Seed Dataset' },
      verifiedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ProjectSite', projectSiteSchema);
