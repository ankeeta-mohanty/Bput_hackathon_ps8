const mongoose = require('mongoose');

const submissionStatusEnum = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'CORRECTION_REQUIRED',
  'APPROVED',
];

const auditTrailEventSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: ['CREATED_DRAFT', 'UPDATED_DRAFT', 'SUBMITTED', 'MARKED_UNDER_REVIEW', 'REQUESTED_CORRECTION', 'APPROVED'],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    previousStatus: {
      type: String,
    },
    newStatus: {
      type: String,
      required: true,
    },
    comments: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const esgSubmissionSchema = new mongoose.Schema(
  {
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectSite',
      required: [true, 'Project Site ID is required'],
    },
    subsidiaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subsidiary',
      required: [true, 'Subsidiary ID is required'],
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Group ID is required'],
    },
    reportingPeriod: {
      type: String,
      required: [true, 'Reporting period is required (e.g. Q1, Q2, M04, Annual)'],
      trim: true,
    },
    reportingYear: {
      type: Number,
      required: [true, 'Reporting year is required (e.g. 2025)'],
      min: [2000, 'Reporting year must be 2000 or later'],
      max: [2100, 'Reporting year must be 2100 or earlier'],
    },
    status: {
      type: String,
      enum: {
        values: submissionStatusEnum,
        message: '{VALUE} is not a valid submission status',
      },
      default: 'DRAFT',
    },
    rawMetrics: {
      energy: {
        electricityKWh: { type: Number, default: null, min: [0, 'Electricity consumption cannot be negative'] },
        dieselLitres: { type: Number, default: null, min: [0, 'Diesel consumption cannot be negative'] },
        petrolLitres: { type: Number, default: null, min: [0, 'Petrol consumption cannot be negative'] },
      },
      water: {
        withdrawalKL: { type: Number, default: null, min: [0, 'Water withdrawal cannot be negative'] },
        dischargeKL: { type: Number, default: null, min: [0, 'Water discharge cannot be negative'] },
      },
      waste: {
        hazardousWasteMT: { type: Number, default: null, min: [0, 'Hazardous waste cannot be negative'] },
        nonHazardousWasteMT: { type: Number, default: null, min: [0, 'Non-hazardous waste cannot be negative'] },
        recycledWasteMT: { type: Number, default: null, min: [0, 'Recycled waste cannot be negative'] },
      },
      social: {
        totalEmployees: { type: Number, default: null, min: [0, 'Employee count cannot be negative'] },
        femaleEmployees: { type: Number, default: null, min: [0, 'Female employee count cannot be negative'] },
        fatalities: { type: Number, default: null, min: [0, 'Fatalities cannot be negative'] },
        lostTimeInjuries: { type: Number, default: null, min: [0, 'Lost time injuries cannot be negative'] },
      },
      governance: {
        antiCorruptionPolicyApproved: { type: Boolean, default: null },
        poshComplaintsReceived: { type: Number, default: null, min: [0, 'POSH complaints cannot be negative'] },
        poshComplaintsResolved: { type: Number, default: null, min: [0, 'Resolved complaints cannot be negative'] },
      },
    },
    calculatedMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    validationResults: {
      isValid: { type: Boolean, default: true },
      errors: { type: [String], default: [] },
      warnings: { type: [String], default: [] },
    },
    dataProvenance: {
      sourceType: { type: String, default: 'site_manual_entry', enum: ['site_manual_entry', 'meter_csv_import', 'sample_seed_unverified'] },
      evidenceNotes: { type: String, trim: true, default: '' },
      documentReferences: { type: [String], default: [] },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator User ID is required'],
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewComments: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
    version: {
      type: Number,
      default: 1,
      min: [1, 'Version must be at least 1'],
    },
    auditTrail: [auditTrailEventSchema],
  },
  {
    timestamps: true,
  }
);

/**
 * Compound unique index:
 * Prevents accidental duplicate submissions for the same site, year, period, and version.
 */
esgSubmissionSchema.index(
  { siteId: 1, reportingYear: 1, reportingPeriod: 1, version: 1 },
  { unique: true }
);

/**
 * Organizational hierarchy validation:
 * Before saving, verify that:
 * 1. ProjectSite exists and its subsidiaryId matches this submission's subsidiaryId.
 * 2. Subsidiary exists and its groupId matches this submission's groupId.
 */
esgSubmissionSchema.pre('save', async function () {
  const ProjectSite = mongoose.model('ProjectSite');
  const Subsidiary = mongoose.model('Subsidiary');

  const site = await ProjectSite.findById(this.siteId);
  if (!site) {
    throw new Error(`Referenced ProjectSite with ID ${this.siteId} does not exist`);
  }

  if (site.subsidiaryId.toString() !== this.subsidiaryId.toString()) {
    throw new Error(
      `Hierarchy mismatch: ProjectSite ${site.code} belongs to subsidiary ${site.subsidiaryId}, not ${this.subsidiaryId}`
    );
  }

  const sub = await Subsidiary.findById(this.subsidiaryId);
  if (!sub) {
    throw new Error(`Referenced Subsidiary with ID ${this.subsidiaryId} does not exist`);
  }

  if (sub.groupId.toString() !== this.groupId.toString()) {
    throw new Error(
      `Hierarchy mismatch: Subsidiary ${sub.code} belongs to group ${sub.groupId}, not ${this.groupId}`
    );
  }
});

module.exports = mongoose.model('ESGSubmission', esgSubmissionSchema);
