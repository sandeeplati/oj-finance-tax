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

/**
 * Generate forward-looking recommendations for the NEXT financial year (FY 2025-26)
 * based on patterns observed in the current Form 16.
 */
function generateNextYearRecommendations(taxData, comparisonResult, age = 30) {
  const nextYear = [];
  const { oldRegime, newRegime, recommended, savings } = comparisonResult;
  const { salaryDetails, deductions } = taxData;
  const grossSalary = salaryDetails?.grossSalary || 0;
  const taxableIncome = recommended === 'old' ? oldRegime.taxableIncome : newRegime.taxableIncome;

  // ── 1. Regime Planning ──────────────────────────────────────────────────────
  const oldTax = oldRegime.totalTax;
  const newTax = newRegime.totalTax;
  const regimeDiff = Math.abs(oldTax - newTax);

  nextYear.push({
    category: 'Regime Strategy',
    icon: '🏛️',
    priority: 'HIGH',
    title: `Plan for ${recommended === 'old' ? 'Old' : 'New'} Regime in FY 2025-26`,
    description: recommended === 'old'
      ? `Old regime saved you ₹${formatCurrency(savings)} this year. For FY 2025-26, maintain your deduction investments early in the year to keep this advantage.`
      : `New regime saved you ₹${formatCurrency(savings)} this year. FY 2025-26 new regime slabs remain the same — continue with simplified filing.`,
    impact: savings,
    timeline: 'April 2025 onwards',
    actionItems: recommended === 'old'
      ? [
          'Declare investment intent to employer in April 2025 to reduce monthly TDS',
          'Start SIP in ELSS from April to spread ₹1.5L 80C investment across 12 months',
          'Renew health insurance before April to claim 80D from day one',
          'Submit HRA rent receipts quarterly to employer',
          'Invest in NPS 80CCD(1B) ₹50,000 early in the year'
        ]
      : [
          'Opt for New Regime with employer at the start of FY 2025-26',
          'No need to submit investment proofs — simpler payroll',
          'Focus on wealth creation (ELSS, mutual funds) without tax lock-in',
          'Employer NPS contribution (80CCD(2)) still available in new regime'
        ]
  });

  // ── 2. 80C Gap Analysis ─────────────────────────────────────────────────────
  const current80C = deductions.section80C || 0;
  const gap80C = Math.max(0, MAX_80C - current80C);
  if (gap80C > 0 && recommended === 'old') {
    const monthlySIP = Math.ceil(gap80C / 12);
    nextYear.push({
      category: 'Section 80C Planning',
      icon: '📈',
      priority: gap80C > 75000 ? 'HIGH' : 'MEDIUM',
      title: `Start Monthly SIP to Fill ₹${formatCurrency(gap80C)} 80C Gap`,
      description: `This year you utilized ₹${formatCurrency(current80C)} of ₹1,50,000 80C limit. Next year, start a monthly SIP of ₹${formatCurrency(monthlySIP)} from April to fully utilize the limit without year-end rush.`,
      impact: calculateTaxSaving(gap80C, taxableIncome),
      timeline: 'Start April 2025',
      actionItems: [
        `Start ELSS SIP of ₹${formatCurrency(monthlySIP)}/month from April 2025`,
        'Set up auto-debit to avoid missing months',
        'ELSS has 3-year lock-in but best returns among 80C options',
        'Alternatively: increase VPF contribution for guaranteed returns',
        'PPF: deposit before April 5 each year for maximum interest'
      ]
    });
  }

  // ── 3. Health Insurance ─────────────────────────────────────────────────────
  const current80D = deductions.section80D || 0;
  const max80D = age >= 60 ? 100000 : 50000;
  const gap80D = Math.max(0, max80D - current80D);
  if (gap80D > 0 && recommended === 'old') {
    nextYear.push({
      category: 'Health Insurance',
      icon: '🏥',
      priority: 'HIGH',
      title: 'Upgrade Health Insurance Coverage for FY 2025-26',
      description: `You claimed ₹${formatCurrency(current80D)} under 80D this year. You can claim up to ₹${formatCurrency(max80D)} (self + parents). Upgrading coverage saves tax AND provides better protection.`,
      impact: calculateTaxSaving(gap80D, taxableIncome),
      timeline: 'Before April 2025',
      actionItems: [
        'Renew/upgrade family floater plan before April 2025',
        'Add parents to policy for additional ₹25,000–₹50,000 deduction',
        'Consider top-up plan for higher coverage at lower premium',
        'Preventive health check-up: ₹5,000 within 80D limit',
        'Keep premium receipts for ITR filing'
      ]
    });
  }

  // ── 4. NPS Planning ─────────────────────────────────────────────────────────
  const currentNPS = deductions.nps || 0;
  if (currentNPS < MAX_NPS_80CCD1B && recommended === 'old') {
    const npsGap = MAX_NPS_80CCD1B - currentNPS;
    const monthlyNPS = Math.ceil(npsGap / 12);
    nextYear.push({
      category: 'NPS Investment',
      icon: '🏦',
      priority: 'MEDIUM',
      title: 'Maximize NPS 80CCD(1B) — Extra ₹50,000 Deduction',
      description: `NPS gives ₹50,000 deduction OVER AND ABOVE 80C. You used ₹${formatCurrency(currentNPS)} this year. Invest ₹${formatCurrency(monthlyNPS)}/month next year to maximize this benefit.`,
      impact: calculateTaxSaving(npsGap, taxableIncome),
      timeline: 'April 2025 onwards',
      actionItems: [
        `Set up monthly NPS contribution of ₹${formatCurrency(monthlyNPS)} via employer or bank`,
        'Ask employer to deduct NPS from salary (80CCD(2) — no limit in new regime too)',
        'Choose Tier I account for tax benefits',
        'Equity allocation (up to 75%) recommended for long-term growth',
        'NPS returns are market-linked; historically 10-12% p.a.'
      ]
    });
  }

  // ── 5. Salary Structure Optimization ───────────────────────────────────────
  const hra = salaryDetails.hra || 0;
  const lta = salaryDetails.lta || 0;
  const specialAllowance = salaryDetails.specialAllowance || 0;

  if (specialAllowance > 0 && (hra === 0 || lta === 0) && recommended === 'old') {
    nextYear.push({
      category: 'Salary Restructuring',
      icon: '💼',
      priority: 'MEDIUM',
      title: 'Restructure Salary to Reduce Taxable Income',
      description: `Your salary has ₹${formatCurrency(specialAllowance)} as special allowance (fully taxable). Request HR to restructure into tax-exempt components for FY 2025-26.`,
      impact: calculateTaxSaving(Math.min(specialAllowance * 0.3, 50000), taxableIncome),
      timeline: 'April 2025 (start of new FY)',
      actionItems: [
        'Request HRA component if you pay rent (50% of basic in metro, 40% non-metro)',
        'Add LTA component — 2 tax-free journeys per 4-year block',
        'Food coupons/meal allowance: ₹50/meal × 2 meals × 22 days = ₹26,400/year tax-free',
        'Phone/internet reimbursement: actual bills tax-free',
        'Uniform/dress allowance if applicable',
        'Discuss with HR at the start of FY 2025-26'
      ]
    });
  }

  // ── 6. Home Loan Planning ───────────────────────────────────────────────────
  if (grossSalary > 800000 && !deductions.homeLoanInterest) {
    nextYear.push({
      category: 'Home Loan',
      icon: '🏡',
      priority: 'LOW',
      title: 'Consider Home Loan for Dual Tax Benefits in FY 2025-26',
      description: `With your income of ₹${formatCurrency(grossSalary)}, a home loan gives dual benefits: Principal under 80C (₹1.5L) + Interest under 24(b) (₹2L). Total potential saving: ₹${formatCurrency(calculateTaxSaving(350000, taxableIncome))}/year.`,
      impact: calculateTaxSaving(350000, taxableIncome),
      timeline: 'Plan before FY 2025-26',
      actionItems: [
        'Section 24(b): Deduct up to ₹2,00,000 on home loan interest',
        'Section 80C: Principal repayment within ₹1.5L limit',
        'First-time buyers: Additional ₹50,000 under Section 80EE',
        'Affordable housing (< ₹45L): Additional ₹1.5L under Section 80EEA',
        'Joint home loan: Both co-borrowers can claim separately'
      ]
    });
  }

  // ── 7. Advance Tax Planning ─────────────────────────────────────────────────
  const tdsPaid = taxData.taxDetails?.tdsPaid || 0;
  const totalTax = recommended === 'old' ? oldRegime.totalTax : newRegime.totalTax;
  const taxDue = Math.max(0, totalTax - tdsPaid);

  if (taxDue > 10000) {
    nextYear.push({
      category: 'Advance Tax',
      icon: '📅',
      priority: 'HIGH',
      title: 'Plan Advance Tax Payments for FY 2025-26',
      description: `You had ₹${formatCurrency(taxDue)} tax due this year. For FY 2025-26, pay advance tax in installments to avoid interest under Section 234B/234C.`,
      impact: Math.round(taxDue * 0.01 * 3), // ~3 months interest saved
      timeline: 'June 15, Sep 15, Dec 15, Mar 15',
      actionItems: [
        '15 June 2025: Pay 15% of estimated annual tax',
        '15 September 2025: Pay 45% of estimated annual tax',
        '15 December 2025: Pay 75% of estimated annual tax',
        '15 March 2026: Pay 100% of estimated annual tax',
        'Pay via incometax.gov.in → e-Pay Tax → Advance Tax (Code 100)',
        'Interest @ 1%/month for shortfall under Section 234B/234C'
      ]
    });
  }

  // ── 8. Investment Diversification ──────────────────────────────────────────
  if (grossSalary > 600000) {
    nextYear.push({
      category: 'Wealth Building',
      icon: '💹',
      priority: 'LOW',
      title: 'Build Tax-Efficient Investment Portfolio for FY 2025-26',
      description: 'Beyond tax saving, build a diversified portfolio. Long-term capital gains up to ₹1.25L are tax-free; ELSS and equity funds are most tax-efficient.',
      impact: 0,
      timeline: 'FY 2025-26',
      actionItems: [
        'ELSS: Tax saving + wealth creation (LTCG ₹1.25L tax-free)',
        'PPF: Risk-free, tax-free returns at 7.1% p.a.',
        'Index Funds: Low cost, market returns, LTCG tax-efficient',
        'Sovereign Gold Bonds: 2.5% interest + gold appreciation, tax-free on maturity',
        'Avoid FDs for high earners — interest fully taxable at slab rate',
        'Consider Debt Mutual Funds for better post-tax returns vs FD'
      ]
    });
  }

  // ── 9. ITR Filing Strategy ──────────────────────────────────────────────────
  nextYear.push({
    category: 'ITR Strategy',
    icon: '📋',
    priority: 'MEDIUM',
    title: 'File ITR Early for FY 2025-26 (AY 2026-27)',
    description: 'Filing ITR early (April–June) speeds up refunds, avoids last-minute errors, and allows time to respond to any notices.',
    impact: 0,
    timeline: 'April–July 2026',
    actionItems: [
      'Collect Form 16 from employer by June 15, 2026',
      'Download Form 26AS and AIS from income tax portal',
      'Cross-check TDS in Form 26AS with Form 16',
      'File ITR-1 (salaried, income ≤ ₹50L) or ITR-2 (capital gains)',
      'e-Verify within 30 days using Aadhaar OTP',
      'Deadline: July 31, 2026 (without penalty)'
    ]
  });

  // Sort by priority
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  nextYear.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return nextYear;
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

module.exports = { generateRecommendations, generateNextYearRecommendations, generateTaxSummary, formatCurrency };

// Made with Bob
