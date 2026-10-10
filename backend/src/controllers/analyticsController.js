const { ESGSubmission, ProjectSite, Subsidiary } = require('../models');

/**
 * GET /api/analytics/group-rollup
 * Computes live consolidated ESG indicators from actual APPROVED submissions.
 * No hardcoded metrics. If no records exist, computes true zeros or not yet reported.
 */
const getGroupRollup = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== 'GROUP_ESG_EXECUTIVE' && user.role !== 'SUBSIDIARY_ESG_MANAGER') {
      return res.status(403).json({ success: false, message: 'Access denied to group consolidation analytics' });
    }

    if (!user.groupId) {
      return res.status(403).json({ success: false, message: 'User is not assigned to a group' });
    }

    const rawPeriod = req.query.period ? String(req.query.period).trim() : '';
    let parsedYear = req.query.year ? Number(req.query.year) : null;
    let parsedPeriod = rawPeriod;

    // Support periods formatted like "FY2025-Q3", "2025-Q3", "FY2025-Annual"
    const periodMatch = rawPeriod.match(/(?:FY)?(\d{4})[-_\s]?(Q[1-4]|Annual|M\d{2})/i);
    if (periodMatch) {
      if (!parsedYear) {
        parsedYear = parseInt(periodMatch[1], 10);
      }
      parsedPeriod = periodMatch[2].toUpperCase();
    }

    if (!parsedYear || isNaN(parsedYear)) {
      parsedYear = 2025;
    }

    // Find all subsidiaries in user's group
    const subsidiaries = await Subsidiary.find({ groupId: user.groupId }).select('_id name code');
    const subIds = subsidiaries.map((s) => s._id);

    // Total enterprise project sites in group
    const totalSitesInGroup = await ProjectSite.countDocuments({ subsidiaryId: { $in: subIds } });

    // Submission query filter for approved submissions
    const filter = {
      groupId: user.groupId,
      status: 'APPROVED',
      reportingYear: parsedYear,
    };

    if (parsedPeriod) {
      const periodCandidates = Array.from(new Set([parsedPeriod, rawPeriod].filter(Boolean)));
      filter.reportingPeriod = periodCandidates.length === 1 ? periodCandidates[0] : { $in: periodCandidates };
    }

    const approvedSubmissions = await ESGSubmission.find(filter)
      .populate('siteId', 'name code location')
      .populate('subsidiaryId', 'name code')
      .sort({ version: -1, updatedAt: -1 })
      .lean();

    // Prevent duplicate counting: keep only the latest approved version per site
    const latestApprovedBySite = new Map();
    for (const sub of approvedSubmissions) {
      const sId = sub.siteId?._id?.toString() || sub.siteId?.toString();
      if (sId && !latestApprovedBySite.has(sId)) {
        latestApprovedBySite.set(sId, sub);
      }
    }
    const eligibleApprovedSubmissions = Array.from(latestApprovedBySite.values());
    const approvedSitesCount = eligibleApprovedSubmissions.length;

    // Query submissions pending review for the same period
    const pendingFilter = {
      groupId: user.groupId,
      status: { $in: ['SUBMITTED', 'UNDER_REVIEW'] },
      reportingYear: parsedYear,
    };
    if (parsedPeriod) {
      const periodCandidates = Array.from(new Set([parsedPeriod, rawPeriod].filter(Boolean)));
      pendingFilter.reportingPeriod = periodCandidates.length === 1 ? periodCandidates[0] : { $in: periodCandidates };
    }
    const pendingReviewSubmissionsCount = await ESGSubmission.countDocuments(pendingFilter);

    const completenessPct =
      totalSitesInGroup > 0 ? Number(((approvedSitesCount / totalSitesInGroup) * 100).toFixed(1)) : 0;
    const completenessStatus =
      completenessPct === 100 ? 'Complete' : approvedSitesCount === 0 ? 'Not yet reported' : 'In Progress';

    // Aggregate totals from actual persisted calculatedMetrics & rawMetrics
    let totalScope1 = 0;
    let totalScope2 = 0;
    let totalGHG = 0;
    let totalWaterWithdrawal = 0;
    let totalWaterDischarge = 0;
    let totalNetWater = 0;
    let totalWaste = 0;
    let totalRecycledWaste = 0;
    let totalWorkforce = 0;
    let totalFemale = 0;
    let totalFatalities = 0;
    let totalLTIs = 0;

    let scope1Count = 0;
    let scope2Count = 0;
    let ghgCount = 0;
    let waterWithdrawalCount = 0;
    let waterDischargeCount = 0;
    let netWaterCount = 0;
    let wasteTotalCount = 0;
    let wasteRecycledCount = 0;
    let workforceCount = 0;
    let femaleCount = 0;
    let fatalitiesCount = 0;
    let ltiCount = 0;

    for (const sub of eligibleApprovedSubmissions) {
      const calc = sub.calculatedMetrics || {};
      const em = calc.emissions || {};
      const wt = calc.water || {};
      const ws = calc.waste || {};
      const raw = sub.rawMetrics || {};
      const soc = raw.social || {};

      // Scope 1
      const s1 = typeof calc.scope1Emissions_tCO2e === 'number'
        ? calc.scope1Emissions_tCO2e
        : typeof em.totalScope1TCO2e === 'number'
        ? em.totalScope1TCO2e
        : null;
      if (s1 !== null) {
        totalScope1 += s1;
        scope1Count++;
      }

      // Scope 2
      const s2 = typeof calc.scope2Emissions_tCO2e === 'number'
        ? calc.scope2Emissions_tCO2e
        : typeof em.scope2ElectricityTCO2e === 'number'
        ? em.scope2ElectricityTCO2e
        : null;
      if (s2 !== null) {
        totalScope2 += s2;
        scope2Count++;
      }

      // Total GHG
      const ghg = typeof calc.totalGHGEmissions_tCO2e === 'number'
        ? calc.totalGHGEmissions_tCO2e
        : typeof em.totalGHGTCO2e === 'number'
        ? em.totalGHGTCO2e
        : (s1 !== null || s2 !== null)
        ? (s1 || 0) + (s2 || 0)
        : null;
      if (ghg !== null) {
        totalGHG += ghg;
        ghgCount++;
      }

      // Water Withdrawal & Discharge
      const wIn = typeof wt.withdrawalKL === 'number'
        ? wt.withdrawalKL
        : typeof raw.water?.withdrawalKL === 'number'
        ? raw.water.withdrawalKL
        : null;
      if (wIn !== null) {
        totalWaterWithdrawal += wIn;
        waterWithdrawalCount++;
      }

      const wOut = typeof wt.dischargeKL === 'number'
        ? wt.dischargeKL
        : typeof raw.water?.dischargeKL === 'number'
        ? raw.water.dischargeKL
        : null;
      if (wOut !== null) {
        totalWaterDischarge += wOut;
        waterDischargeCount++;
      }

      const wNet = typeof calc.netWaterConsumption_m3 === 'number'
        ? calc.netWaterConsumption_m3
        : typeof wt.netWaterConsumptionKL === 'number'
        ? wt.netWaterConsumptionKL
        : (wIn !== null || wOut !== null)
        ? Math.max(0, (wIn || 0) - (wOut || 0))
        : null;
      if (wNet !== null) {
        totalNetWater += wNet;
        netWaterCount++;
      }

      // Waste
      const wGen = typeof ws.totalWasteGeneratedMT === 'number'
        ? ws.totalWasteGeneratedMT
        : typeof raw.waste?.nonHazardousWasteMT === 'number'
        ? raw.waste.nonHazardousWasteMT
        : null;
      if (wGen !== null) {
        totalWaste += wGen;
        wasteTotalCount++;
      }

      const wRec = typeof ws.recycledWasteMT === 'number'
        ? ws.recycledWasteMT
        : typeof raw.waste?.recycledWasteMT === 'number'
        ? raw.waste.recycledWasteMT
        : null;
      if (wRec !== null) {
        totalRecycledWaste += wRec;
        wasteRecycledCount++;
      }

      // Social
      const emp = typeof soc.totalEmployees === 'number'
        ? soc.totalEmployees
        : typeof soc.workforceCount === 'number'
        ? soc.workforceCount
        : null;
      if (emp !== null) {
        totalWorkforce += emp;
        workforceCount++;
      }

      const fem = typeof soc.femaleEmployees === 'number' ? soc.femaleEmployees : null;
      if (fem !== null) {
        totalFemale += fem;
        femaleCount++;
      }

      const fat = typeof soc.fatalities === 'number'
        ? soc.fatalities
        : typeof soc.fatalitiesCount === 'number'
        ? soc.fatalitiesCount
        : null;
      if (fat !== null) {
        totalFatalities += fat;
        fatalitiesCount++;
      }

      const lti = typeof soc.lostTimeInjuries === 'number' ? soc.lostTimeInjuries : null;
      if (lti !== null) {
        totalLTIs += lti;
        ltiCount++;
      }
    }

    const recyclingRatePct =
      wasteTotalCount > 0 && totalWaste > 0
        ? Number(((totalRecycledWaste / totalWaste) * 100).toFixed(2))
        : null;

    const femaleDiversityPct =
      workforceCount > 0 && totalWorkforce > 0
        ? Number(((totalFemale / totalWorkforce) * 100).toFixed(1))
        : null;

    const consolidatedMetrics = {
      totalScope1Emissions_tCO2e: scope1Count > 0 ? Number(totalScope1.toFixed(4)) : null,
      totalScope2Emissions_tCO2e: scope2Count > 0 ? Number(totalScope2.toFixed(4)) : null,
      totalConsolidatedGHG_tCO2e: ghgCount > 0 ? Number(totalGHG.toFixed(4)) : null,
      totalNetWaterConsumption_m3: netWaterCount > 0 ? Number(totalNetWater.toFixed(2)) : null,
      consolidatedWasteRecyclingRate_pct: recyclingRatePct,
      totalFatalities: fatalitiesCount > 0 ? totalFatalities : null,
    };

    const conglomerateTotals = {
      emissions: {
        scope1TCO2e: scope1Count > 0 ? Number(totalScope1.toFixed(2)) : null,
        scope2TCO2e: scope2Count > 0 ? Number(totalScope2.toFixed(2)) : null,
        totalGHGTCO2e: ghgCount > 0 ? Number(totalGHG.toFixed(2)) : null,
        unit: 'tCO2e',
      },
      water: {
        withdrawalKL: waterWithdrawalCount > 0 ? Number(totalWaterWithdrawal.toFixed(2)) : null,
        dischargeKL: waterDischargeCount > 0 ? Number(totalWaterDischarge.toFixed(2)) : null,
        netConsumptionKL: netWaterCount > 0 ? Number(totalNetWater.toFixed(2)) : null,
        unit: 'kL',
      },
      waste: {
        totalGeneratedMT: wasteTotalCount > 0 ? Number(totalWaste.toFixed(2)) : null,
        totalRecycledMT: wasteRecycledCount > 0 ? Number(totalRecycledWaste.toFixed(2)) : null,
        recyclingRatePct: recyclingRatePct !== null ? recyclingRatePct : 0,
        unit: 'MT',
      },
      social: {
        totalWorkforce: workforceCount > 0 ? totalWorkforce : null,
        femaleWorkforce: femaleCount > 0 ? totalFemale : null,
        femaleDiversityPct: femaleDiversityPct !== null ? femaleDiversityPct : 0,
        fatalities: fatalitiesCount > 0 ? totalFatalities : 0,
        lostTimeInjuries: ltiCount > 0 ? totalLTIs : 0,
      },
    };

    const responsePayload = {
      reportingYear: parsedYear,
      reportingPeriod: rawPeriod || parsedPeriod || 'All Periods',
      eligibleApprovedSubmissionsCount: approvedSitesCount,
      approvedSubmissionsCount: approvedSitesCount,
      totalSitesEligible: totalSitesInGroup,
      reportingCompleteness_pct: completenessPct,
      pendingReviewSubmissionsCount,
      completeness: {
        totalSitesInGroup,
        approvedSitesCount,
        completenessPct,
        status: completenessStatus,
      },
      consolidatedMetrics,
      conglomerateTotals,
      methodologyProvenance: {
        scope1FactorSource: 'IPCC 2006 Guidelines (Vol 2 Energy)',
        scope2FactorSource: 'CEA India CO2 Baseline Database v19.0 (2024)',
        accountingBoundary: 'Operational Control across Conglomerate Subsidiaries',
      },
    };

    return res.status(200).json({
      success: true,
      data: responsePayload,
      ...responsePayload,
    });
  } catch (error) {
    console.error('[Get Group Rollup Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to compute group consolidation' });
  }
};

module.exports = {
  getGroupRollup,
};
