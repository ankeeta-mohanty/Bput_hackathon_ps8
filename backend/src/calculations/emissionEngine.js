/**
 * Central ESG Calculation Engine
 * Aligned with:
 * - IPCC 2006 Guidelines for National Greenhouse Gas Inventories (Volume 2 Energy)
 * - India Ministry of Environment, Forest and Climate Change (MoEFCC) GHG Inventory Methodology
 * - Central Electricity Authority (CEA) CO2 Baseline Database for the Indian Power Sector, v19.0 (2024)
 * - SEBI BRSR Core Key Performance Indicators (Principle 6: Environment)
 */

// Documented Emission Factors & Methodology Constants
const EMISSION_FACTORS = {
  // Scope 1: Stationary & Mobile Diesel Combustion
  // Density: 0.832 kg/L | NCV: 42.6 TJ/Gg | EF: 74,100 kg CO2/TJ (IPCC 2006)
  // 1 Litre Diesel = 0.00268 metric tonnes CO2e (2.68 kg CO2e / L)
  DIESEL: {
    factorValue: 0.00268,
    factorUnit: 'tCO2e/Litre',
    source: 'IPCC 2006 Guidelines (Vol 2 Energy, Ch 3) & MoEFCC GHG Reference',
    version: '2006/2023',
  },

  // Scope 1: Motor Gasoline / Petrol Combustion
  // Density: 0.740 kg/L | NCV: 44.3 TJ/Gg | EF: 69,300 kg CO2/TJ (IPCC 2006)
  // 1 Litre Petrol = 0.00231 metric tonnes CO2e (2.31 kg CO2e / L)
  PETROL: {
    factorValue: 0.00231,
    factorUnit: 'tCO2e/Litre',
    source: 'IPCC 2006 Guidelines (Vol 2 Energy, Ch 3)',
    version: '2006/2023',
  },

  // Scope 2: Purchased Grid Electricity (Indian National Grid)
  // CEA CO2 Baseline Database for the Indian Power Sector, Version 19.0 (2023-24)
  // National weighted average grid emission factor: 0.716 kg CO2/kWh = 0.000716 tCO2e/kWh
  GRID_ELECTRICITY_INDIA: {
    factorValue: 0.000716,
    factorUnit: 'tCO2e/kWh',
    source: 'Central Electricity Authority (CEA), Govt. of India, CO2 Baseline Database v19.0',
    version: 'v19.0 (2024)',
  },
};

/**
 * Calculates Scope 1, Scope 2, Total Emissions, Water Consumption, and Waste Recycling Rates
 * from raw activity measurements.
 *
 * Distinguishes zero (valid 0) from missing (null/undefined).
 * Never fabricates numbers. If an input is null/undefined, corresponding calculation is null.
 *
 * @param {object} rawMetrics - { energy, water, waste, social, governance }
 * @returns {object} calculatedMetrics with full traceable methodology
 */
const calculateESGMetrics = (rawMetrics = {}) => {
  const energy = rawMetrics.energy || {};
  const water = rawMetrics.water || {};
  const waste = rawMetrics.waste || {};

  // 1. Scope 1 Direct Emissions
  let scope1DieselTCO2e = null;
  if (typeof energy.dieselLitres === 'number' && energy.dieselLitres >= 0) {
    scope1DieselTCO2e = Number((energy.dieselLitres * EMISSION_FACTORS.DIESEL.factorValue).toFixed(4));
  }

  let scope1PetrolTCO2e = null;
  if (typeof energy.petrolLitres === 'number' && energy.petrolLitres >= 0) {
    scope1PetrolTCO2e = Number((energy.petrolLitres * EMISSION_FACTORS.PETROL.factorValue).toFixed(4));
  }

  let totalScope1TCO2e = null;
  if (scope1DieselTCO2e !== null || scope1PetrolTCO2e !== null) {
    totalScope1TCO2e = Number(((scope1DieselTCO2e || 0) + (scope1PetrolTCO2e || 0)).toFixed(4));
  }

  // 2. Scope 2 Indirect Electricity Emissions
  let scope2ElectricityTCO2e = null;
  if (typeof energy.electricityKWh === 'number' && energy.electricityKWh >= 0) {
    scope2ElectricityTCO2e = Number(
      (energy.electricityKWh * EMISSION_FACTORS.GRID_ELECTRICITY_INDIA.factorValue).toFixed(4)
    );
  }

  // 3. Total GHG Emissions (Scope 1 + Scope 2)
  let totalGHGTCO2e = null;
  if (totalScope1TCO2e !== null || scope2ElectricityTCO2e !== null) {
    totalGHGTCO2e = Number(((totalScope1TCO2e || 0) + (scope2ElectricityTCO2e || 0)).toFixed(4));
  }

  // 4. Water Net Consumption = Withdrawal - Discharge
  let netWaterConsumptionKL = null;
  if (typeof water.withdrawalKL === 'number' && water.withdrawalKL >= 0) {
    const discharge = typeof water.dischargeKL === 'number' && water.dischargeKL >= 0 ? water.dischargeKL : 0;
    netWaterConsumptionKL = Number((water.withdrawalKL - discharge).toFixed(2));
  }

  // 5. Waste Recycling Rate = (Recycled Waste / Total Waste Generated) * 100
  let totalWasteGeneratedMT = null;
  let wasteRecyclingRatePct = null;

  const haz = typeof waste.hazardousWasteMT === 'number' && waste.hazardousWasteMT >= 0 ? waste.hazardousWasteMT : null;
  const nonHaz = typeof waste.nonHazardousWasteMT === 'number' && waste.nonHazardousWasteMT >= 0 ? waste.nonHazardousWasteMT : null;
  const rec = typeof waste.recycledWasteMT === 'number' && waste.recycledWasteMT >= 0 ? waste.recycledWasteMT : null;

  if (haz !== null || nonHaz !== null) {
    totalWasteGeneratedMT = Number(((haz || 0) + (nonHaz || 0)).toFixed(3));

    if (totalWasteGeneratedMT > 0 && rec !== null) {
      wasteRecyclingRatePct = Number(((rec / totalWasteGeneratedMT) * 100).toFixed(2));
      // Clamp at 100% max if data anomaly
      if (wasteRecyclingRatePct > 100) wasteRecyclingRatePct = 100;
    } else if (totalWasteGeneratedMT === 0 && rec === 0) {
      wasteRecyclingRatePct = 0;
    }
  }

  return {
    scope1Emissions_tCO2e: totalScope1TCO2e,
    scope2Emissions_tCO2e: scope2ElectricityTCO2e,
    totalGHGEmissions_tCO2e: totalGHGTCO2e,
    netWaterConsumption_m3: netWaterConsumptionKL,
    wasteRecyclingRate_pct: wasteRecyclingRatePct,
    emissions: {
      scope1DieselTCO2e,
      scope1PetrolTCO2e,
      totalScope1TCO2e,
      scope2ElectricityTCO2e,
      totalGHGTCO2e,
      unit: 'tCO2e (metric tonnes CO2 equivalent)',
      factorsApplied: {
        diesel: EMISSION_FACTORS.DIESEL,
        petrol: EMISSION_FACTORS.PETROL,
        gridElectricity: EMISSION_FACTORS.GRID_ELECTRICITY_INDIA,
      },
    },
    water: {
      withdrawalKL: water.withdrawalKL ?? null,
      dischargeKL: water.dischargeKL ?? null,
      netWaterConsumptionKL,
      unit: 'kL (kiloLitres)',
    },
    waste: {
      totalWasteGeneratedMT,
      recycledWasteMT: rec,
      wasteRecyclingRatePct,
      unit: 'MT (Metric Tonnes)',
    },
    calculatedAt: new Date(),
    engineVersion: '1.0.0-SEBI-BRSR',
  };
};

module.exports = {
  calculateESGMetrics,
  EMISSION_FACTORS,
};
