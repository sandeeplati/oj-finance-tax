import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Detect if running on GitHub Pages (no backend available)
const IS_GITHUB_PAGES = window.location.hostname.includes('github.io') ||
  process.env.REACT_APP_DEMO_MODE === 'true';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// ─── Client-side tax engine (used on GitHub Pages / demo mode) ───────────────

const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
];

const NEW_REGIME_SLABS_2425 = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 700000, rate: 0.05 },
  { min: 700000, max: 1000000, rate: 0.10 },
  { min: 1000000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
];

const calcSlabTax = (income, slabs) => {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxable = Math.min(income, slab.max) - slab.min;
    tax += taxable * slab.rate;
  }
  return Math.round(tax);
};

const calcSurcharge = (tax, income) => {
  if (income > 50000000) return Math.round(tax * 0.37);
  if (income > 20000000) return Math.round(tax * 0.25);
  if (income > 10000000) return Math.round(tax * 0.15);
  if (income > 5000000) return Math.round(tax * 0.10);
  return 0;
};

const clientCalculateTax = (taxData, age) => {
  const { salaryDetails = {}, deductions = {}, taxDetails = {} } = taxData;
  const gross = salaryDetails.grossSalary || 0;
  const hra = salaryDetails.hra || 0;

  // ── Old Regime ──
  const stdDedOld = 50000;
  const hraExemption = deductions.hraExemption || 0;
  const sec80C = Math.min(deductions.section80C || 0, 150000);
  const sec80D = Math.min(deductions.section80D || 0, age >= 60 ? 50000 : 25000);
  const nps = Math.min(deductions.nps || 0, 50000);
  const profTax = Math.min(deductions.professionalTax || 0, 2500);
  const sec80G = deductions.section80G || 0;
  const sec80E = deductions.section80E || 0;
  const sec80TTA = Math.min(deductions.section80TTA || 0, 10000);

  const totalDeductionsOld = stdDedOld + hraExemption + sec80C + sec80D + nps + profTax + sec80G + sec80E + sec80TTA;
  const taxableOld = Math.max(0, gross - totalDeductionsOld);
  let taxOld = calcSlabTax(taxableOld, OLD_REGIME_SLABS);
  // 87A rebate old regime
  if (taxableOld <= 500000) taxOld = 0;
  const surchargeOld = calcSurcharge(taxOld, taxableOld);
  const cessOld = Math.round((taxOld + surchargeOld) * 0.04);
  const totalTaxOld = taxOld + surchargeOld + cessOld;
  const tdsPaid = taxDetails.tdsPaid || 0;
  const refundOld = Math.max(0, tdsPaid - totalTaxOld);
  const dueOld = Math.max(0, totalTaxOld - tdsPaid);

  // ── New Regime ──
  const stdDedNew = 75000;
  const taxableNew = Math.max(0, gross - stdDedNew);
  let taxNew = calcSlabTax(taxableNew, NEW_REGIME_SLABS_2425);
  // 87A rebate new regime
  if (taxableNew <= 700000) taxNew = 0;
  const surchargeNew = calcSurcharge(taxNew, taxableNew);
  const cessNew = Math.round((taxNew + surchargeNew) * 0.04);
  const totalTaxNew = taxNew + surchargeNew + cessNew;
  const refundNew = Math.max(0, tdsPaid - totalTaxNew);
  const dueNew = Math.max(0, totalTaxNew - tdsPaid);

  const recommended = totalTaxOld <= totalTaxNew ? 'old' : 'new';
  const savings = Math.abs(totalTaxOld - totalTaxNew);

  // ── Recommendations ──
  const recommendations = [];
  if (sec80C < 150000) recommendations.push({
    title: 'Maximize Section 80C',
    description: `You can invest ₹${(150000 - sec80C).toLocaleString('en-IN')} more in PPF, ELSS, LIC, or EPF to save up to ₹${Math.round((150000 - sec80C) * 0.3).toLocaleString('en-IN')} in tax.`,
    potentialSaving: Math.round((150000 - sec80C) * 0.3),
    priority: 'high',
    section: '80C',
  });
  if (sec80D < 25000) recommendations.push({
    title: 'Health Insurance (Section 80D)',
    description: `Buy health insurance to claim up to ₹25,000 deduction under Section 80D.`,
    potentialSaving: Math.round((25000 - sec80D) * 0.3),
    priority: 'high',
    section: '80D',
  });
  if (nps < 50000) recommendations.push({
    title: 'NPS Investment (Section 80CCD 1B)',
    description: `Invest up to ₹50,000 in NPS for additional deduction over and above 80C limit.`,
    potentialSaving: Math.round((50000 - nps) * 0.3),
    priority: 'medium',
    section: '80CCD(1B)',
  });
  if (hra > 0 && hraExemption === 0) recommendations.push({
    title: 'Claim HRA Exemption',
    description: 'You receive HRA but have not claimed exemption. Submit rent receipts to your employer.',
    potentialSaving: Math.round(hra * 0.5 * 0.3),
    priority: 'high',
    section: 'HRA',
  });
  if (recommended === 'new') recommendations.push({
    title: 'Switch to New Tax Regime',
    description: `New regime saves you ₹${savings.toLocaleString('en-IN')} compared to old regime for your income profile.`,
    potentialSaving: savings,
    priority: 'high',
    section: 'Regime',
  });
  if (recommended === 'old') recommendations.push({
    title: 'Stay with Old Tax Regime',
    description: `Old regime saves you ₹${savings.toLocaleString('en-IN')} due to your deductions. Keep maximizing 80C, 80D, NPS.`,
    potentialSaving: savings,
    priority: 'high',
    section: 'Regime',
  });

  return {
    success: true,
    data: {
      taxData,
      comparisonResult: {
        recommended,
        savings,
        oldRegime: {
          taxableIncome: taxableOld,
          basicTax: taxOld,
          surcharge: surchargeOld,
          cess: cessOld,
          totalTax: totalTaxOld,
          tdsPaid,
          refund: refundOld,
          taxDue: dueOld,
          totalDeductions: totalDeductionsOld,
        },
        newRegime: {
          taxableIncome: taxableNew,
          basicTax: taxNew,
          surcharge: surchargeNew,
          cess: cessNew,
          totalTax: totalTaxNew,
          tdsPaid,
          refund: refundNew,
          taxDue: dueNew,
          totalDeductions: stdDedNew,
        },
      },
      recommendations,
    },
  };
};

// ─── Client-side multi-Form16 merge (used on GitHub Pages) ───────────────────

/**
 * Merge multiple client-side parsed tax data objects.
 * Since we can't parse PDFs client-side, this is used when the user
 * manually provides data for multiple employers.
 */
export const clientMergeMultipleForm16 = (parsedList) => {
  if (parsedList.length === 1) return parsedList[0];

  const merged = {
    employeeInfo: parsedList[0].employeeInfo || {},
    employers: parsedList.map((p, i) => ({
      index: i + 1,
      employerInfo: p.employerInfo || {},
      salaryDetails: p.salaryDetails || {},
      taxDetails: { tdsPaid: (p.taxDetails || {}).tdsPaid || 0 },
    })),
    salaryDetails: {
      grossSalary: 0, basicSalary: 0, hra: 0,
      specialAllowance: 0, lta: 0, medicalAllowance: 0,
      otherAllowances: 0, perquisites: 0, netSalary: 0,
    },
    deductions: parsedList[parsedList.length - 1].deductions || {},
    taxDetails: {
      tdsPaid: 0,
      assessmentYear: (parsedList[0].taxDetails || {}).assessmentYear || '2024-25',
    },
  };

  for (const p of parsedList) {
    const s = p.salaryDetails || {};
    merged.salaryDetails.grossSalary += s.grossSalary || 0;
    merged.salaryDetails.basicSalary += s.basicSalary || 0;
    merged.salaryDetails.hra += s.hra || 0;
    merged.salaryDetails.specialAllowance += s.specialAllowance || 0;
    merged.salaryDetails.lta += s.lta || 0;
    merged.salaryDetails.medicalAllowance += s.medicalAllowance || 0;
    merged.salaryDetails.otherAllowances += s.otherAllowances || 0;
    merged.salaryDetails.perquisites += s.perquisites || 0;
    merged.salaryDetails.netSalary += s.netSalary || 0;
    merged.taxDetails.tdsPaid += (p.taxDetails || {}).tdsPaid || 0;
  }

  return merged;
};

// ─── API functions ────────────────────────────────────────────────────────────

export const uploadForm16 = async (file, age) => {
  if (IS_GITHUB_PAGES) {
    throw new Error('PDF upload requires the backend server. Please use Manual Entry instead.');
  }
  const formData = new FormData();
  formData.append('form16', file);
  formData.append('age', age);
  const response = await api.post('/tax/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Upload multiple Form 16 PDFs (for users who changed jobs during the year).
 * @param {File[]} files - Array of PDF File objects
 * @param {number} age - Employee age
 * @param {string[]} [passwords] - Optional array of PDF passwords (one per file, usually PAN number)
 */
export const uploadMultipleForm16 = async (files, age, passwords = []) => {
  if (IS_GITHUB_PAGES) {
    throw new Error('PDF upload requires the backend server. Please use Manual Entry instead.');
  }
  const formData = new FormData();
  files.forEach(file => formData.append('form16s', file));
  formData.append('age', age);
  // Send passwords as an array field (one per file)
  passwords.forEach(pw => formData.append('passwords', pw || ''));
  const response = await api.post('/tax/upload-multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const calculateTax = async (taxData, age) => {
  if (IS_GITHUB_PAGES) {
    // Run calculation client-side on GitHub Pages
    return clientCalculateTax(taxData, age);
  }
  try {
    const response = await api.post('/tax/calculate', { taxData, age });
    return response.data;
  } catch (err) {
    // Fallback to client-side if backend is unreachable
    console.warn('Backend unreachable, using client-side calculation:', err.message);
    return clientCalculateTax(taxData, age);
  }
};

export const getTaxSlabs = async () => {
  if (IS_GITHUB_PAGES) return { success: true, data: {} };
  try {
    const response = await api.get('/tax/slabs');
    return response.data;
  } catch {
    return { success: true, data: {} };
  }
};

export const getDeductionsInfo = async () => {
  if (IS_GITHUB_PAGES) return { success: true, data: {} };
  try {
    const response = await api.get('/tax/deductions');
    return response.data;
  } catch {
    return { success: true, data: {} };
  }
};

export default api;

// Made with Bob
