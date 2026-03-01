/**
 * Indian Tax Calculator - FY 2024-25 (AY 2025-26)
 * Supports both Old and New Tax Regime
 */

// New Tax Regime Slabs (FY 2024-25)
const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 0.05 },
  { min: 700000, max: 1000000, rate: 0.10 },
  { min: 1000000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 }
];

// Old Tax Regime Slabs (FY 2024-25) - Below 60 years
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 }
];

// Old Tax Regime Slabs - Senior Citizens (60-80 years)
const OLD_REGIME_SENIOR_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 }
];

// Old Tax Regime Slabs - Super Senior Citizens (80+ years)
const OLD_REGIME_SUPER_SENIOR_SLABS = [
  { min: 0, max: 500000, rate: 0 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 }
];

const STANDARD_DEDUCTION_OLD = 50000;
const STANDARD_DEDUCTION_NEW = 75000;
const MAX_80C = 150000;
const MAX_80D_SELF = 25000;
const MAX_80D_SENIOR_PARENTS = 50000;
const MAX_80TTA = 10000;
const MAX_NPS_80CCD1B = 50000;
const REBATE_87A_OLD = 12500; // for income up to 5L
const REBATE_87A_NEW = 25000; // for income up to 7L

/**
 * Calculate tax based on slabs
 */
function calculateTaxFromSlabs(income, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxableInSlab = Math.min(income, slab.max) - slab.min;
    tax += taxableInSlab * slab.rate;
  }
  return Math.round(tax);
}

/**
 * Calculate surcharge
 */
function calculateSurcharge(income, tax) {
  if (income > 50000000) return tax * 0.37; // 37% for >5Cr (old regime capped at 25%)
  if (income > 20000000) return tax * 0.25; // 25% for >2Cr
  if (income > 10000000) return tax * 0.15; // 15% for >1Cr
  if (income > 5000000) return tax * 0.10;  // 10% for >50L
  return 0;
}

/**
 * Calculate total tax with cess and surcharge
 */
function calculateTotalTax(income, baseTax, regime) {
  let tax = baseTax;

  // Apply rebate u/s 87A
  if (regime === 'new' && income <= 700000) {
    tax = Math.max(0, tax - REBATE_87A_NEW);
  } else if (regime === 'old' && income <= 500000) {
    tax = Math.max(0, tax - REBATE_87A_OLD);
  }

  const surcharge = calculateSurcharge(income, tax);
  const taxWithSurcharge = tax + surcharge;
  const cess = Math.round(taxWithSurcharge * 0.04); // 4% Health & Education Cess

  return {
    baseTax: Math.round(baseTax),
    rebate87A: regime === 'new' && income <= 700000 ? Math.min(REBATE_87A_NEW, baseTax) :
               regime === 'old' && income <= 500000 ? Math.min(REBATE_87A_OLD, baseTax) : 0,
    taxAfterRebate: Math.round(tax),
    surcharge: Math.round(surcharge),
    cess,
    totalTax: Math.round(taxWithSurcharge + cess)
  };
}

/**
 * Calculate tax under Old Regime
 */
function calculateOldRegimeTax(taxData, age = 30) {
  const { salaryDetails, deductions } = taxData;

  const grossSalary = salaryDetails.grossSalary || 0;
  const standardDeduction = STANDARD_DEDUCTION_OLD;
  const professionalTax = deductions.professionalTax || 0;
  const hraExemption = deductions.hraExemption || 0;

  // Chapter VI-A deductions
  const sec80C = Math.min(deductions.section80C || 0, MAX_80C);
  const sec80D = deductions.section80D || 0;
  const sec80G = deductions.section80G || 0;
  const sec80E = deductions.section80E || 0;
  const sec80TTA = Math.min(deductions.section80TTA || 0, MAX_80TTA);
  const nps80CCD1B = Math.min(deductions.nps || 0, MAX_NPS_80CCD1B);

  const totalDeductions = standardDeduction + professionalTax + hraExemption +
    sec80C + sec80D + sec80G + sec80E + sec80TTA + nps80CCD1B;

  const taxableIncome = Math.max(0, grossSalary - totalDeductions);

  let slabs = OLD_REGIME_SLABS;
  if (age >= 80) slabs = OLD_REGIME_SUPER_SENIOR_SLABS;
  else if (age >= 60) slabs = OLD_REGIME_SENIOR_SLABS;

  const baseTax = calculateTaxFromSlabs(taxableIncome, slabs);
  const taxBreakdown = calculateTotalTax(taxableIncome, baseTax, 'old');

  return {
    regime: 'old',
    grossSalary,
    standardDeduction,
    hraExemption,
    professionalTax,
    deductions: { sec80C, sec80D, sec80G, sec80E, sec80TTA, nps80CCD1B },
    totalDeductions,
    taxableIncome,
    ...taxBreakdown
  };
}

/**
 * Calculate tax under New Regime
 */
function calculateNewRegimeTax(taxData) {
  const { salaryDetails } = taxData;
  const grossSalary = salaryDetails.grossSalary || 0;
  const standardDeduction = STANDARD_DEDUCTION_NEW;

  // New regime: very limited deductions
  const taxableIncome = Math.max(0, grossSalary - standardDeduction);
  const baseTax = calculateTaxFromSlabs(taxableIncome, NEW_REGIME_SLABS);
  const taxBreakdown = calculateTotalTax(taxableIncome, baseTax, 'new');

  return {
    regime: 'new',
    grossSalary,
    standardDeduction,
    totalDeductions: standardDeduction,
    taxableIncome,
    ...taxBreakdown
  };
}

/**
 * Compare both regimes and recommend the better one
 */
function compareTaxRegimes(taxData, age = 30) {
  const oldRegime = calculateOldRegimeTax(taxData, age);
  const newRegime = calculateNewRegimeTax(taxData);

  const savings = newRegime.totalTax - oldRegime.totalTax;
  const recommended = savings > 0 ? 'old' : 'new';

  return {
    oldRegime,
    newRegime,
    recommended,
    savings: Math.abs(savings),
    savingsRegime: recommended
  };
}

module.exports = {
  calculateOldRegimeTax,
  calculateNewRegimeTax,
  compareTaxRegimes,
  MAX_80C,
  MAX_80D_SELF,
  MAX_80D_SENIOR_PARENTS,
  MAX_NPS_80CCD1B,
  MAX_80TTA,
  STANDARD_DEDUCTION_OLD,
  STANDARD_DEDUCTION_NEW
};

// Made with Bob
