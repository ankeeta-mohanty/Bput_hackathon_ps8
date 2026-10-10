const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Group code is required'],
      unique: true,
      trim: true,
      uppercase: true,
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

module.exports = mongoose.model('Group', groupSchema);
