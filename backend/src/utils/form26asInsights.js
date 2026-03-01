/**
 * Form 26AS Insights Engine
 * Generates insights, alerts, and recommendations by analyzing Form 26AS data
 * and cross-referencing with Form 16 data (if available).
 */

const fmt = (n) => new Intl.NumberFormat('en-IN').format(Math.round(n));

/**
 * Generate comprehensive insights from Form 26AS data.
 * @param {Object} form26asData - Parsed Form 26AS data
 * @param {Object|null} form16Data - Parsed Form 16 data (optional, for cross-verification)
 * @returns {Object} insights object with alerts, recommendations, summary
 */
function generateForm26ASInsights(form26asData, form16Data = null) {
  const insights = {
    alerts: [],           // Critical issues requiring action
    warnings: [],         // Potential issues to review
    positives: [],        // Good news / confirmations
    recommendations: [],  // Action items
    reconciliation: null, // Form 16 vs 26AS comparison (if Form 16 provided)
    taxCreditSummary: {}, // Summary of all tax credits
  };

  const { summary, partA, partC, partD, highValueTransactions, tdsBySection } = form26asData;

  // ── 1. TDS Credit Summary ──────────────────────────────────────────────────
  insights.taxCreditSummary = {
    totalTDS: summary.totalTDS,
    advanceTax: summary.advanceTax,
    selfAssessmentTax: summary.selfAssessmentTax,
    totalTaxesPaid: summary.totalTaxesPaid,
    totalRefund: summary.totalRefund,
  };

  // ── 2. Salary TDS Check ────────────────────────────────────────────────────
  if (partA.salaryTDS > 0) {
    insights.positives.push({
      title: 'Salary TDS Credited',
      description: `₹${fmt(partA.salaryTDS)} TDS on salary (Section 192) is credited in Form 26AS.`,
      icon: '✅',
    });
  }

  // ── 3. Other Income TDS ────────────────────────────────────────────────────
  if (partA.otherTDS > 0) {
    insights.positives.push({
      title: 'Additional TDS Credits Found',
      description: `₹${fmt(partA.otherTDS)} TDS from non-salary sources (interest, rent, etc.) is credited.`,
      icon: '💰',
    });

    // Check for interest income TDS (194A)
    if (tdsBySection['194A']) {
      insights.recommendations.push({
        priority: 'medium',
        title: 'Declare Interest Income',
        description: `TDS of ₹${fmt(tdsBySection['194A'].amount)} was deducted on interest income (Section 194A). Ensure you declare this interest income in your ITR to claim the TDS credit.`,
        action: 'Add interest income under "Income from Other Sources" in your ITR.',
        icon: '🏦',
      });
    }

    // Check for rent TDS (194I)
    if (tdsBySection['194I']) {
      insights.recommendations.push({
        priority: 'medium',
        title: 'Declare Rental Income',
        description: `TDS of ₹${fmt(tdsBySection['194I'].amount)} was deducted on rent (Section 194I). Declare this rental income in your ITR.`,
        action: 'Add rental income under "Income from House Property" in your ITR.',
        icon: '🏠',
      });
    }

    // Check for professional fees TDS (194J)
    if (tdsBySection['194J']) {
      insights.recommendations.push({
        priority: 'medium',
        title: 'Declare Professional/Freelance Income',
        description: `TDS of ₹${fmt(tdsBySection['194J'].amount)} was deducted on professional fees (Section 194J). Declare this income in your ITR.`,
        action: 'Add professional income under "Profits and Gains from Business/Profession" in your ITR.',
        icon: '💼',
      });
    }
  }

  // ── 4. Advance Tax Check ───────────────────────────────────────────────────
  if (summary.advanceTax > 0) {
    insights.positives.push({
      title: 'Advance Tax Paid',
      description: `₹${fmt(summary.advanceTax)} advance tax is credited in Form 26AS.`,
      icon: '✅',
    });
  } else if (form16Data) {
    // Check if advance tax should have been paid
    const taxableIncome = form16Data.taxDetails?.taxableIncome || 0;
    if (taxableIncome > 1000000) { // > 10 lakhs
      insights.warnings.push({
        title: 'No Advance Tax Found',
        description: 'No advance tax payments found in Form 26AS. For high income earners, advance tax is mandatory if tax liability exceeds ₹10,000.',
        icon: '⚠️',
      });
    }
  }

  // ── 5. Self-Assessment Tax ─────────────────────────────────────────────────
  if (summary.selfAssessmentTax > 0) {
    insights.positives.push({
      title: 'Self-Assessment Tax Paid',
      description: `₹${fmt(summary.selfAssessmentTax)} self-assessment tax is credited.`,
      icon: '✅',
    });
  }

  // ── 6. Refund Status ───────────────────────────────────────────────────────
  if (summary.totalRefund > 0) {
    insights.positives.push({
      title: 'Tax Refund Received',
      description: `₹${fmt(summary.totalRefund)} refund was received from Income Tax Department.`,
      icon: '💚',
    });
  }

  // ── 7. High-Value Transactions ─────────────────────────────────────────────
  if (highValueTransactions.length > 0) {
    insights.warnings.push({
      title: 'High-Value Transactions Reported',
      description: `${highValueTransactions.length} high-value transaction(s) reported in Form 26AS/AIS. These are reported to the Income Tax Department and must be declared in your ITR.`,
      transactions: highValueTransactions,
      icon: '🔍',
    });

    for (const txn of highValueTransactions) {
      if (txn.type.includes('Cash')) {
        insights.alerts.push({
          severity: 'high',
          title: 'Cash Transaction Reported',
          description: `Cash transaction of ₹${fmt(txn.amount)} has been reported. Ensure this is properly explained and declared in your ITR to avoid scrutiny.`,
          icon: '🚨',
        });
      }
      if (txn.type.includes('Property')) {
        insights.recommendations.push({
          priority: 'high',
          title: 'Property Transaction — Capital Gains',
          description: `Property transaction of ₹${fmt(txn.amount)} reported. Calculate capital gains (short-term or long-term) and declare in ITR.`,
          action: 'Compute capital gains and file ITR-2 or ITR-3 as applicable.',
          icon: '🏘️',
        });
      }
    }
  }

  // ── 8. Form 16 vs Form 26AS Reconciliation ─────────────────────────────────
  if (form16Data) {
    const form16TDS = form16Data.taxDetails?.tdsPaid || 0;
    const form26TDS = summary.totalTDS;
    const difference = Math.abs(form16TDS - form26TDS);
    const tolerancePercent = 0.01; // 1% tolerance for rounding
    const tolerance = Math.max(100, form16TDS * tolerancePercent);

    insights.reconciliation = {
      form16TDS,
      form26TDS,
      difference,
      isMatching: difference <= tolerance,
      status: difference <= tolerance ? 'MATCH' : (form26TDS > form16TDS ? 'FORM26AS_HIGHER' : 'FORM16_HIGHER'),
    };

    if (difference <= tolerance) {
      insights.positives.push({
        title: 'TDS Reconciliation: ✅ Match',
        description: `Form 16 TDS (₹${fmt(form16TDS)}) matches Form 26AS TDS (₹${fmt(form26TDS)}). Your tax records are consistent.`,
        icon: '✅',
      });
    } else if (form26TDS > form16TDS) {
      insights.positives.push({
        title: 'Additional TDS Credits in Form 26AS',
        description: `Form 26AS shows ₹${fmt(form26TDS)} total TDS vs ₹${fmt(form16TDS)} in Form 16. The extra ₹${fmt(difference)} may be from other income sources (interest, rent, etc.).`,
        icon: '💰',
      });
      insights.recommendations.push({
        priority: 'high',
        title: 'Claim All TDS Credits',
        description: `You have ₹${fmt(difference)} additional TDS in Form 26AS beyond your salary TDS. Ensure you declare all income sources and claim this TDS credit in your ITR.`,
        action: 'Verify all income sources and claim TDS credit from Form 26AS in your ITR.',
        icon: '📋',
      });
    } else {
      insights.alerts.push({
        severity: 'high',
        title: '⚠️ TDS Mismatch — Action Required',
        description: `Form 16 shows ₹${fmt(form16TDS)} TDS but Form 26AS shows only ₹${fmt(form26TDS)}. Difference: ₹${fmt(difference)}. This mismatch can cause issues during ITR processing.`,
        icon: '🚨',
      });
      insights.recommendations.push({
        priority: 'critical',
        title: 'Resolve TDS Mismatch Before Filing',
        description: `Your Form 16 TDS (₹${fmt(form16TDS)}) is higher than Form 26AS (₹${fmt(form26TDS)}) by ₹${fmt(difference)}. Contact your employer to deposit the TDS and update Form 26AS before filing ITR.`,
        action: 'Contact HR/Finance to verify TDS deposit. Check TRACES portal for updated Form 26AS.',
        icon: '📞',
      });
    }

    // Check taxable income consistency
    const form16TaxableIncome = form16Data.taxDetails?.taxableIncome || 0;
    if (form16TaxableIncome > 0 && partA.otherTDS > 0) {
      insights.recommendations.push({
        priority: 'medium',
        title: 'Include All Income Sources in ITR',
        description: `Form 26AS shows TDS from non-salary sources (₹${fmt(partA.otherTDS)}). Your total income in ITR should include salary (₹${fmt(form16TaxableIncome)}) plus other income sources.`,
        action: 'Add all income sources (interest, rent, freelance, etc.) in your ITR filing.',
        icon: '📊',
      });
    }
  }

  // ── 9. General Filing Recommendations ─────────────────────────────────────
  if (summary.totalTaxesPaid > 0) {
    insights.recommendations.push({
      priority: 'low',
      title: 'Verify Form 26AS Before Filing ITR',
      description: 'Always download and verify Form 26AS from the Income Tax portal before filing your ITR. Ensure all TDS credits are reflected correctly.',
      action: 'Login to incometax.gov.in → e-File → Income Tax Returns → View Form 26AS',
      icon: '📋',
    });
  }

  // Check for missing TDS entries
  if (partA.entries.length === 0 && summary.totalTDS === 0) {
    insights.warnings.push({
      title: 'No TDS Entries Found',
      description: 'No TDS entries were extracted from Form 26AS. The PDF format may not be supported, or TDS may not have been deducted.',
      icon: '⚠️',
    });
  }

  // ── 10. Tax Liability Estimate (if Form 16 available) ─────────────────────
  if (form16Data) {
    const taxPayable = form16Data.taxDetails?.taxPayable || 0;
    const surcharge = form16Data.taxDetails?.surcharge || 0;
    const cess = form16Data.taxDetails?.educationCess || 0;
    const totalTaxLiability = taxPayable + surcharge + cess;
    const totalCreditAvailable = summary.totalTaxesPaid;
    const netTaxDue = totalTaxLiability - totalCreditAvailable;

    if (netTaxDue > 1000) {
      insights.alerts.push({
        severity: 'high',
        title: 'Additional Tax Due',
        description: `Based on Form 16 and Form 26AS, you may have ₹${fmt(netTaxDue)} additional tax to pay. Pay self-assessment tax before filing ITR to avoid interest under Section 234B/234C.`,
        icon: '🚨',
      });
    } else if (netTaxDue < -1000) {
      insights.positives.push({
        title: 'Tax Refund Expected',
        description: `You may be eligible for a refund of approximately ₹${fmt(Math.abs(netTaxDue))}. File your ITR promptly to claim the refund.`,
        icon: '💚',
      });
    } else {
      insights.positives.push({
        title: 'Tax Liability Settled',
        description: 'Your tax liability appears to be fully settled through TDS and advance tax payments.',
        icon: '✅',
      });
    }
  }

  // Sort recommendations by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  insights.recommendations.sort((a, b) =>
    (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3)
  );

  return insights;
}

module.exports = { generateForm26ASInsights };

// Made with Bob