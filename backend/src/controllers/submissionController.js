const mongoose = require('mongoose');
const { ESGSubmission, ProjectSite, Subsidiary } = require('../models');
const { calculateESGMetrics } = require('../calculations/emissionEngine');

/**
 * Validate raw numerical metric boundaries
 */
const validateRawMetrics = (rawMetrics = {}) => {
  const errors = [];
  const warnings = [];

  const checkNonNegative = (val, label) => {
    if (val !== null && val !== undefined) {
      if (typeof val !== 'number' || isNaN(val)) {
        errors.push(`${label} must be a valid number`);
      } else if (val < 0) {
        errors.push(`${label} cannot be negative (${val})`);
      }
    }
  };

  const energy = rawMetrics.energy || {};
  checkNonNegative(energy.electricityKWh, 'Electricity Consumption');
  checkNonNegative(energy.dieselLitres, 'Diesel Consumption');
  checkNonNegative(energy.petrolLitres, 'Petrol Consumption');

  const water = rawMetrics.water || {};
  checkNonNegative(water.withdrawalKL, 'Water Withdrawal');
  checkNonNegative(water.dischargeKL, 'Water Discharge');
  if (
    typeof water.withdrawalKL === 'number' &&
    typeof water.dischargeKL === 'number' &&
    water.dischargeKL > water.withdrawalKL
  ) {
    warnings.push('Water discharge exceeds total withdrawal. Please verify meter readings.');
  }

  const waste = rawMetrics.waste || {};
  checkNonNegative(waste.hazardousWasteMT, 'Hazardous Waste');
  checkNonNegative(waste.nonHazardousWasteMT, 'Non-Hazardous Waste');
  checkNonNegative(waste.recycledWasteMT, 'Recycled Waste');

  const social = rawMetrics.social || {};
  checkNonNegative(social.totalEmployees, 'Total Employees');
  checkNonNegative(social.femaleEmployees, 'Female Employees');
  checkNonNegative(social.fatalities, 'Workplace Fatalities');
  checkNonNegative(social.lostTimeInjuries, 'Lost Time Injuries');
  if (
    typeof social.totalEmployees === 'number' &&
    typeof social.femaleEmployees === 'number' &&
    social.femaleEmployees > social.totalEmployees
  ) {
    errors.push('Female employees count cannot exceed total workforce count');
  }

  return { isValid: errors.length === 0, errors, warnings };
};

/**
 * GET /api/submissions
 * Scoped retrieval of ESG submissions based on user role
 */
const getSubmissions = async (req, res) => {
  try {
    const user = req.user;
    const { siteId, status, year, period } = req.query;

    let filter = {};

    if (user.role === 'SITE_MANAGER') {
      filter.siteId = { $in: user.siteIds || [] };
    } else if (user.role === 'SUBSIDIARY_ESG_MANAGER') {
      filter.subsidiaryId = user.subsidiaryId;
    } else if (user.role === 'GROUP_ESG_EXECUTIVE') {
      filter.groupId = user.groupId;
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Apply optional filters if they fall within authorized bounds
    if (siteId) {
      if (user.role === 'SITE_MANAGER' && !(user.siteIds || []).some((id) => id.toString() === siteId)) {
        return res.status(403).json({ success: false, message: 'Access denied to requested site submissions' });
      }
      filter.siteId = siteId;
    }
    if (status) filter.status = status;
    if (year) filter.reportingYear = Number(year);
    if (period) filter.reportingPeriod = period;

    const submissions = await ESGSubmission.find(filter)
      .populate('siteId', 'name code location')
      .populate('subsidiaryId', 'name code')
      .populate('createdBy', 'name email role')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error('[Get Submissions Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve ESG submissions' });
  }
};

/**
 * GET /api/submissions/:id
 */
const getSubmissionById = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID format' });
    }

    const submission = await ESGSubmission.findById(id)
      .populate('siteId', 'name code location')
      .populate('subsidiaryId', 'name code')
      .populate('createdBy', 'name email role')
      .populate('submittedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('auditTrail.performedBy', 'name email role');

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Verify role authorization
    if (user.role === 'SITE_MANAGER') {
      const hasSite = (user.siteIds || []).some((sid) => sid.toString() === submission.siteId._id.toString());
      if (!hasSite) {
        return res.status(403).json({ success: false, message: 'Access denied: submission belongs to another site' });
      }
    } else if (user.role === 'SUBSIDIARY_ESG_MANAGER') {
      if (submission.subsidiaryId._id.toString() !== user.subsidiaryId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied: submission belongs to another subsidiary' });
      }
    } else if (user.role === 'GROUP_ESG_EXECUTIVE') {
      if (submission.groupId.toString() !== user.groupId.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied: submission belongs to another group' });
      }
    }

    return res.status(200).json({ success: true, data: submission });
  } catch (error) {
    console.error('[Get Submission By Id Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve submission details' });
  }
};

/**
 * POST /api/submissions
 * Create or update a draft ESG submission
 */
const createOrUpdateDraft = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'SITE_MANAGER') {
      return res.status(403).json({ success: false, message: 'Only Site Managers can create or edit site submissions' });
    }

    const { siteId, reportingYear, reportingPeriod, rawMetrics, dataProvenance } = req.body || {};

    const yearNum = reportingYear !== undefined && reportingYear !== null && reportingYear !== '' ? Number(reportingYear) : null;
    const periodStr = typeof reportingPeriod === 'string' ? reportingPeriod.trim() : null;

    if (!siteId || !yearNum || isNaN(yearNum) || !periodStr) {
      return res.status(400).json({ success: false, message: 'siteId, reportingYear, and reportingPeriod are required' });
    }

    if (yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({ success: false, message: 'Reporting year must be between 2000 and 2100' });
    }

    // Verify site is assigned to this user
    const isAssigned = (user.siteIds || []).some((id) => id.toString() === siteId.toString());
    if (!isAssigned) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this project site' });
    }

    // Resolve authoritative site, subsidiary, and group from MongoDB
    const site = await ProjectSite.findById(siteId).populate('subsidiaryId');
    if (!site) {
      return res.status(404).json({ success: false, message: 'Project site does not exist' });
    }

    const subsidiaryId = site.subsidiaryId._id;
    const groupId = site.subsidiaryId.groupId;

    // Normalize metric field naming variations for seamless compatibility
    const metricsPayload = rawMetrics || {
      energy: req.body?.energy,
      water: req.body?.water,
      waste: req.body?.waste,
      social: req.body?.social,
      governance: req.body?.governance,
    };

    const normalizedRawMetrics = {
      energy: {
        electricityKWh:
          metricsPayload?.energy?.electricityKWh ??
          metricsPayload?.energy?.electricityKwh ??
          metricsPayload?.energy?.electricityGrid_kWh ??
          null,
        dieselLitres:
          metricsPayload?.energy?.dieselLitres ??
          metricsPayload?.energy?.dieselLiters ??
          metricsPayload?.energy?.diesel_liters ??
          null,
        petrolLitres:
          metricsPayload?.energy?.petrolLitres ??
          metricsPayload?.energy?.petrolLiters ??
          metricsPayload?.energy?.petrol_liters ??
          null,
      },
      water: {
        withdrawalKL:
          metricsPayload?.water?.withdrawalKL ??
          metricsPayload?.water?.withdrawalM3 ??
          metricsPayload?.water?.totalWaterWithdrawal_m3 ??
          metricsPayload?.water?.municipalWater_m3 ??
          null,
        dischargeKL:
          metricsPayload?.water?.dischargeKL ??
          metricsPayload?.water?.dischargeM3 ??
          metricsPayload?.water?.totalWaterDischarge_m3 ??
          null,
      },
      waste: {
        hazardousWasteMT:
          metricsPayload?.waste?.hazardousWasteMT ??
          metricsPayload?.waste?.hazardousWaste_mt ??
          null,
        nonHazardousWasteMT:
          metricsPayload?.waste?.nonHazardousWasteMT ??
          metricsPayload?.waste?.totalGeneratedMT ??
          metricsPayload?.waste?.nonHazardousWaste_mt ??
          metricsPayload?.waste?.totalWasteGenerated_mt ??
          null,
        recycledWasteMT:
          metricsPayload?.waste?.recycledWasteMT ??
          metricsPayload?.waste?.recycledMT ??
          metricsPayload?.waste?.wasteRecycled_mt ??
          null,
      },
      social: {
        totalEmployees:
          metricsPayload?.social?.totalEmployees ??
          metricsPayload?.social?.workforceCount ??
          metricsPayload?.social?.totalWorkforce_count ??
          metricsPayload?.social?.permanentEmployees_count ??
          null,
        femaleEmployees:
          metricsPayload?.social?.femaleEmployees ??
          metricsPayload?.social?.femaleEmployees_count ??
          null,
        fatalities:
          metricsPayload?.social?.fatalities ??
          metricsPayload?.social?.fatalitiesCount ??
          metricsPayload?.social?.fatalities_count ??
          null,
        lostTimeInjuries:
          metricsPayload?.social?.lostTimeInjuries ??
          metricsPayload?.social?.lostTimeInjuries_count ??
          null,
      },
      governance: {
        antiCorruptionPolicyApproved:
          metricsPayload?.governance?.antiCorruptionPolicyApproved ??
          metricsPayload?.governance?.antiCorruptionPolicyImplemented ??
          (metricsPayload?.governance?.ehsPolicyAdopted !== undefined
            ? metricsPayload.governance.ehsPolicyAdopted === true || metricsPayload.governance.ehsPolicyAdopted === 'true'
            : metricsPayload?.governance?.ehsPolicyImplemented ?? null),
        poshComplaintsReceived: metricsPayload?.governance?.poshComplaintsReceived ?? null,
        poshComplaintsResolved: metricsPayload?.governance?.poshComplaintsResolved ?? null,
      },
    };

    // Validate inputs
    const validation = validateRawMetrics(normalizedRawMetrics);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed on raw ESG metrics',
        errors: validation.errors,
      });
    }

    // Execute calculation engine
    const calculatedMetrics = calculateESGMetrics(normalizedRawMetrics);

    // Look for existing draft
    let submission = await ESGSubmission.findOne({
      siteId,
      reportingYear: yearNum,
      reportingPeriod: periodStr,
      version: 1,
    });

    if (submission) {
      // If already submitted or approved, prevent silent draft overwrite
      if (submission.status === 'SUBMITTED' || submission.status === 'APPROVED') {
        return res.status(400).json({
          success: false,
          message: `Cannot edit submission while in '${submission.status}' status. Request a revision or correction first.`,
        });
      }

      const prevStatus = submission.status;
      submission.rawMetrics = normalizedRawMetrics;
      submission.calculatedMetrics = calculatedMetrics;
      submission.validationResults = validation;
      if (dataProvenance?.evidenceNotes) {
        submission.dataProvenance.evidenceNotes = dataProvenance.evidenceNotes;
      }
      submission.auditTrail.push({
        action: 'UPDATED_DRAFT',
        performedBy: user._id,
        previousStatus: prevStatus,
        newStatus: submission.status,
        comments: 'Draft metrics updated by Site Manager',
        timestamp: new Date(),
      });

      await submission.save();
      return res.status(200).json({ success: true, message: 'Draft updated successfully', data: submission });
    } else {
      submission = new ESGSubmission({
        siteId,
        subsidiaryId,
        groupId,
        reportingYear: Number(reportingYear),
        reportingPeriod: reportingPeriod.trim(),
        status: 'DRAFT',
        rawMetrics: normalizedRawMetrics,
        calculatedMetrics,
        validationResults: validation,
        dataProvenance: {
          sourceType: 'site_manual_entry',
          evidenceNotes: dataProvenance?.evidenceNotes || '',
          documentReferences: dataProvenance?.documentReferences || [],
        },
        createdBy: user._id,
        version: 1,
        auditTrail: [
          {
            action: 'CREATED_DRAFT',
            performedBy: user._id,
            previousStatus: null,
            newStatus: 'DRAFT',
            comments: 'Initial draft created by Site Manager',
            timestamp: new Date(),
          },
        ],
      });

      await submission.save();
      return res.status(201).json({ success: true, message: 'Draft created successfully', data: submission });
    }
  } catch (error) {
    console.error('[Create/Update Draft Error]:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Error processing draft' });
  }
};

/**
 * POST /api/submissions/:id/submit
 * Transitions a draft to SUBMITTED state
 */
const submitForReview = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'SITE_MANAGER') {
      return res.status(403).json({ success: false, message: 'Only Site Managers can submit records for review' });
    }

    const { id } = req.params;
    const submission = await ESGSubmission.findById(id);

    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Verify site assignment
    const isAssigned = (user.siteIds || []).some((sid) => sid.toString() === submission.siteId.toString());
    if (!isAssigned) {
      return res.status(403).json({ success: false, message: 'Access denied: You are not assigned to this site' });
    }

    if (submission.status !== 'DRAFT' && submission.status !== 'CORRECTION_REQUIRED') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit a record that is currently '${submission.status}'`,
      });
    }

    const prevStatus = submission.status;
    submission.status = 'SUBMITTED';
    submission.submittedBy = user._id;
    submission.submittedAt = new Date();
    submission.auditTrail.push({
      action: 'SUBMITTED',
      performedBy: user._id,
      previousStatus: prevStatus,
      newStatus: 'SUBMITTED',
      comments: req.body?.comments || 'Submitted for subsidiary ESG review',
      timestamp: new Date(),
    });

    await submission.save();
    return res.status(200).json({ success: true, message: 'Submission sent for subsidiary review', data: submission });
  } catch (error) {
    console.error('[Submit For Review Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Error submitting record for review' });
  }
};

/**
 * POST /api/submissions/:id/review
 * Subsidiary ESG Manager approves or requests correction
 */
const reviewSubmission = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'SUBSIDIARY_ESG_MANAGER') {
      return res.status(403).json({ success: false, message: 'Only Subsidiary ESG Managers can review site submissions' });
    }

    const { id } = req.params;
    const { decision, comments } = req.body || {};

    if (!['APPROVE', 'REQUEST_CORRECTION'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision. Must be either 'APPROVE' or 'REQUEST_CORRECTION'.",
      });
    }

    if (decision === 'REQUEST_CORRECTION' && (!comments || !comments.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Mandatory review comments required when requesting corrections.',
      });
    }

    const submission = await ESGSubmission.findById(id);
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    // Verify subsidiary ownership
    if (submission.subsidiaryId.toString() !== user.subsidiaryId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Submission belongs to a different subsidiary',
      });
    }

    // Separation of duties: creator cannot approve own submission
    if (submission.createdBy.toString() === user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Separation of duties violation: You cannot approve your own submission.',
      });
    }

    if (submission.status !== 'SUBMITTED' && submission.status !== 'UNDER_REVIEW') {
      return res.status(400).json({
        success: false,
        message: `Only submissions in 'SUBMITTED' or 'UNDER_REVIEW' status can be reviewed (current: ${submission.status})`,
      });
    }

    const prevStatus = submission.status;
    const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'CORRECTION_REQUIRED';
    const action = decision === 'APPROVE' ? 'APPROVED' : 'REQUEST_CORRECTION';

    submission.status = newStatus;
    submission.reviewedBy = user._id;
    submission.reviewedAt = new Date();
    submission.reviewComments = comments || '';
    submission.auditTrail.push({
      action,
      performedBy: user._id,
      previousStatus: prevStatus,
      newStatus,
      comments: comments || (decision === 'APPROVE' ? 'Approved by Subsidiary ESG Manager' : 'Correction requested'),
      timestamp: new Date(),
    });

    await submission.save();
    return res.status(200).json({
      success: true,
      message: `Submission status updated to ${newStatus}`,
      data: submission,
    });
  } catch (error) {
    console.error('[Review Submission Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Error reviewing submission' });
  }
};

module.exports = {
  getSubmissions,
  getSubmissionById,
  createOrUpdateDraft,
  submitForReview,
  reviewSubmission,
};
