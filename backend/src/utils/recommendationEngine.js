const {
  MAX_80C, MAX_80D_SELF, MAX_80D_SENIOR_PARENTS,
  MAX_NPS_80CCD1B, MAX_80TTA
} = require('./taxCalculator');

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN').format(Math.round(amount));
}

function calculateTaxSaving(amount, taxableIncome) {
  let rate = 0;
  if (taxableIncome > 1000000) rate = 0.30;
  else if (taxableIncome > 500000) rate = 0.20;
  else if (taxableIncome > 250000) rate = 0.05;
  return Math.round(amount * rate * 1.04); // including 4% cess
}

function generateRecommendations(taxData, comparisonResult, age = 30) {
  const recommendations = [];
  const { oldRegime, newRegime, recommended, savings } = comparisonResult;
  const { salaryDetails, deductions } = taxData;

  // 1. Regime Recommendation
  recommendations.push({
    category: 'Tax Regime',
    priority: 'HIGH',
    icon: '🏛️',
    title: `Switch to ${recommended === 'old' ? 'Old' : 'New'} Tax Regime`,
    description: recommended === 'old'
      ? `Old Tax Regime saves you ₹${formatCurrency(savings)} by claiming deductions.`
      : `New Tax Regime saves you ₹${formatCurrency(savings)} with simplified taxation.`,
    potentialSaving: savings,
    actionItems: recommended === 'old'
      ? ['File ITR under Old Tax Regime', 'Claim all eligible deductions', 'Submit investment proofs to employer']
      : ['Opt for New Tax Regime while filing ITR', 'No need to maintain investment proofs']
  });

  // 2. Section 80C
  const current80C = deductions.section80C || 0;
  const remaining80C = Math.max(0, MAX_80C - current80C);
  if (remaining80C > 0 && recommended === 'old') {
    const taxSaving = calculateTaxSaving(remaining80C, oldRegime.taxableIncome);
    recommendations.push({
      category: 'Section 80C',
      priority: remaining80C > 50000 ? 'HIGH' : 'MEDIUM',
      icon: '💰',
      title: 'Maximize Section 80C Investments',
      description: `Utilized ₹${formatCurrency(current80C)} of ₹1,50,000 limit. Invest ₹${formatCurrency(remaining80C)} more to save ₹${formatCurrency(taxSaving)}.`,
      potentialSaving: taxSaving,
      currentAmount: current80C,
      maxLimit: MAX_80C,
      remaining: remaining80C,
      actionItems: [
        'ELSS Mutual Funds (3-year lock-in, market-linked returns)',
        'PPF - Public Provident Fund (15-year, 7.1% p.a.)',
        'NSC - National Savings Certificate',
        'Tax-saving Fixed Deposits (5-year lock-in)',
        'Life Insurance Premium',
        'EPF/VPF contributions',
        'Home Loan Principal Repayment',
        'Sukanya Samriddhi Yojana (for girl child)'
      ]
    });
  }

  // 3. Section 80D - Health Insurance
  const current80D = deductions.section80D || 0;
  const max80D = age >= 60 ? MAX_80D_SENIOR_PARENTS : MAX_80D_SELF;
  const remaining80D = Math.max(0, max80D - current80D);
  if (remaining80D > 0 && recommended === 'old') {
    const taxSaving = calculateTaxSaving(remaining80D, oldRegime.taxableIncome);
    recommendations.push({
      category: 'Section 80D',
      priority: 'HIGH',
      icon: '🏥',
      title: 'Get Health Insurance for Tax Benefits',
      description: `Health insurance premiums deductible up to ₹${formatCurrency(max80D)}. Claim ₹${formatCurrency(remaining80D)} more to save ₹${formatCurrency(taxSaving)}.`,
      potentialSaving: taxSaving,
      currentAmount: current80D,
      maxLimit: max80D,
      remaining: remaining80D,
      actionItems: [
        'Self & Family: Up to ₹25,000 deduction',
        'Parents (below 60): Additional ₹25,000',
        'Parents (60+): Additional ₹50,000',
        'Preventive health check-up: ₹5,000 within the limit',
        'Consider comprehensive family floater plan'
      ]
    });
  }

  // 4. NPS Section 80CCD(1B)
  const currentNPS = deductions.nps || 0;
  const remainingNPS = Math.max(0, MAX_NPS_80CCD1B - currentNPS);
  if (remainingNPS > 0 && recommended === 'old') {
    const taxSaving = calculateTaxSaving(remainingNPS, oldRegime.taxableIncome);
    recommendations.push({
      category: 'NPS - Section 80CCD(1B)',
      priority: 'MEDIUM',
      icon: '🏦',
      title: 'Invest in NPS for Additional Tax Benefit',
      description: `NPS offers ADDITIONAL ₹50,000 deduction over 80C. Invest ₹${formatCurrency(remainingNPS)} more to save ₹${formatCurrency(taxSaving)}.`,
      potentialSaving: taxSaving,
      currentAmount: currentNPS,
      maxLimit: MAX_NPS_80CCD1B,
      remaining: remainingNPS,
      actionItems: [
        'Open NPS account through employer or bank',
        'Choose Tier I account for tax benefits',
        'Select asset allocation: Equity, Corporate Bonds, Govt Securities',
        'Partial withdrawal allowed after 3 years for specific purposes'
      ]
    });
  }

  // 5. HRA Optimization
  const hra = salaryDetails.hra || 0;
  const hraExemption = deductions.hraExemption || 0;
  if (hra > 0 && hraExemption < hra && recommended === 'old') {
    recommendations.push({
      category: 'HRA Exemption',
      priority: 'MEDIUM',
      icon: '🏠',
      title: 'Optimize HRA Exemption',
      description: 'Ensure maximum HRA exemption is claimed. Exemption = min(Actual HRA, 50%/40% of salary, Rent paid - 10% of salary).',
      potentialSaving: calculateTaxSaving(hra - hraExemption, oldRegime.taxableIncome),
      actionItems: [
        'Submit rent receipts to employer',
        'Ensure rent agreement is in place',
        'If rent > ₹1 lakh/year, landlord PAN is mandatory',
        'Consider paying rent to parents (with proper documentation)',
        'Keep rent receipts for all 12 months'
      ]
    });
  }

  // 6. Home Loan Benefits
  recommendations.push({
    category: 'Home Loan',
    priority: 'LOW',
    icon: '🏡',
    title: 'Consider Home Loan for Tax Benefits',
    description: 'Home loan offers dual tax benefits: Principal under 80C (₹1.5L) and Interest under Section 24(b) (up to ₹2L).',
    potentialSaving: 0,
    actionItems: [
      'Section 24(b): Deduct up to ₹2,00,000 on home loan interest',
      'Section 80C: Principal repayment within ₹1.5L limit',
      'First-time buyers: Additional ₹50,000 under Section 80EE',
      'Affordable housing: Additional ₹1.5L under Section 80EEA',
      'Joint home loan: Both co-borrowers can claim separately'
    ]
  });

  // 7. Section 80TTA
  const current80TTA = deductions.section80TTA || 0;
  if (current80TTA < MAX_80TTA && recommended === 'old') {
    recommendations.push({
      category: 'Section 80TTA',
      priority: 'LOW',
      icon: '🏧',
      title: 'Claim Savings Account Interest Deduction',
      description: `Savings account interest deductible up to ₹10,000 (₹50,000 for seniors under 80TTB).`,
      potentialSaving: calculateTaxSaving(MAX_80TTA - current80TTA, oldRegime.taxableIncome),
      actionItems: [
        'Collect interest certificates from all banks',
        'Include savings account interest in ITR',
        'Senior citizens: claim up to ₹50,000 under 80TTB',
        'FD interest is NOT covered under 80TTA'
      ]
    });
  }

  // 8. LTA
  const lta = salaryDetails.lta || 0;
  if (lta > 0 && recommended === 'old') {
    recommendations.push({
      category: 'LTA',
      priority: 'MEDIUM',
      icon: '✈️',
      title: 'Claim LTA Exemption',
      description: 'LTA is exempt for domestic travel. Claim 2 journeys in a 4-year block (current block: 2022-2025).',
      potentialSaving: calculateTaxSaving(lta, oldRegime.taxableIncome),
      actionItems: [
        'Submit travel bills (train/air tickets) to employer',
        'Only domestic travel is covered',
        'Covers self, spouse, children, dependent parents/siblings',
        'Economy class air or AC first class train travel',
        'Current block: 2022-2025 (2 journeys allowed)'
      ]
    });
  }

  // 9. Section 80G - Donations
  recommendations.push({
    category: 'Section 80G',
    priority: 'LOW',
    icon: '🤝',
    title: 'Claim Deductions on Charitable Donations',
    description: 'Donations to eligible organizations qualify for 50% or 100% deduction under Section 80G.',
    potentialSaving: 0,
    actionItems: [
      'PM Relief Fund, PMNRF: 100% deduction',
      'Approved NGOs: 50% deduction',
      'Keep donation receipts with 80G registration number',
      'Cash donations above ₹2,000 are NOT eligible',
      'Use UPI/bank transfer for donations above ₹2,000'
    ]
  });

  // 10. Tax Refund Alert
  const tdsPaid = taxData.taxDetails?.tdsPaid || 0;
  const totalTax = recommended === 'old' ? oldRegime.totalTax : newRegime.totalTax;
  const refundDue = Math.max(0, tdsPaid - totalTax);
  const taxDue = Math.max(0, totalTax - tdsPaid);

  if (refundDue > 0) {
    recommendations.push({
      category: 'Tax Refund',
      priority: 'HIGH',
      icon: '💸',
      title: `File ITR to Claim ₹${formatCurrency(refundDue)} Refund`,
      description: `You have paid excess TDS of ₹${formatCurrency(refundDue)}. File your ITR before July 31 to get your refund.`,
      potentialSaving: refundDue,
      actionItems: [
        'File ITR-1 (Sahaj) if only salary income',
        'File before July 31 to avoid late filing fee',
        'Verify ITR using Aadhaar OTP or net banking',
        'Refund typically credited within 20-45 days',
        'Track refund status on incometax.gov.in'
      ]
    });
  }

  if (taxDue > 0) {
    recommendations.push({
      category: 'Advance Tax',
      priority: 'HIGH',
      icon: '⚠️',
      title: `Pay Advance Tax to Avoid Penalty`,
      description: `You have tax due of ₹${formatCurrency(taxDue)}. Pay advance tax to avoid interest under Section 234B/234C.`,
      potentialSaving: 0,
      actionItems: [
        'Pay advance tax if liability > ₹10,000',
        'Due dates: 15 Jun (15%), 15 Sep (45%), 15 Dec (75%), 15 Mar (100%)',
        'Pay via income tax portal: incometax.gov.in',
        'Interest @ 1% per month for non-payment under 234B/234C'
      ]
    });
  }

  // 11. ITR Filing Reminder
  recommendations.push({
    category: 'ITR Filing',
    priority: 'HIGH',
    icon: '📋',
    title: 'File Your Income Tax Return',
    description: 'File ITR before July 31 to avoid late filing fee of ₹5,000 (₹1,000 if income < ₹5L).',
    potentialSaving: 0,
    actionItems: [
      'Collect Form 16 from employer',
      'Download Form 26AS from TRACES portal',
      'Check AIS (Annual Information Statement) on income tax portal',
      'File ITR-1 for salary income only',
      'File ITR-2 if you have capital gains or multiple properties',
      'Deadline: July 31 (without penalty)'
    ]
  });

  // Sort by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

function generateTaxSummary(taxData, comparisonResult) {
  const { oldRegime, newRegime, recommended, savings } = comparisonResult;
  const tdsPaid = taxData.taxDetails?.tdsPaid || 0;
  const recommendedTax = recommended === 'old' ? oldRegime.totalTax : newRegime.totalTax;

  return {
    grossIncome: taxData.salaryDetails?.grossSalary || 0,
    oldRegimeTax: oldRegime.totalTax,
    newRegimeTax: newRegime.totalTax,
    recommendedRegime: recommended,
    recommendedTax,
    tdsPaid,
    taxDue: Math.max(0, recommendedTax - tdsPaid),
    refundDue: Math.max(0, tdsPaid - recommendedTax),
    potentialSavings: savings,
    effectiveTaxRate: taxData.salaryDetails?.grossSalary > 0
      ? ((recommendedTax / taxData.salaryDetails.grossSalary) * 100).toFixed(2)
      : 0
  };
}

module.exports = { generateRecommendations, generateTaxSummary, formatCurrency };

// Made with Bob
