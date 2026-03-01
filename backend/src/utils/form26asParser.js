const pdfParse = require('pdf-parse');

/**
 * Parse Form 26AS PDF and extract tax credit information.
 * Form 26AS contains:
 * - Part A: TDS on salary and other income (deducted by employers/banks/others)
 * - Part A1: TDS on sale of immovable property
 * - Part B: TCS (Tax Collected at Source)
 * - Part C: Advance Tax and Self-Assessment Tax paid
 * - Part D: Refunds received
 * - Part E: AIR / SFT (High-value financial transactions)
 * - Part F: TDS on sale of immovable property (buyer's perspective)
 * - Part G: TDS defaults
 *
 * @param {Buffer} pdfBuffer - Raw PDF buffer
 * @param {string} [password] - Optional PDF password (usually PAN number)
 */
async function parseForm26AS(pdfBuffer, password) {
  try {
    const input = password
      ? { data: new Uint8Array(pdfBuffer), password }
      : pdfBuffer;

    const data = await pdfParse(input);
    const text = data.text;
    return extractForm26ASData(text);
  } catch (error) {
    const msg = error.message || '';
    if (msg.includes('No password') || msg.includes('password') || msg.includes('encrypted')) {
      throw new Error('This PDF is password-protected. Please enter the PDF password (usually your PAN number in uppercase, e.g. ABCDE1234F).');
    }
    throw new Error(`Failed to parse Form 26AS PDF: ${error.message}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNum(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '').replace(/\s/g, '')) || 0;
}

function extractAssessmentYear(text) {
  const patterns = [
    /Assessment\s+Year[:\s]+(\d{4}[-–]\d{2,4})/i,
    /A\.?Y\.?[:\s]+(\d{4}[-–]\d{2,4})/i,
    /Annual\s+Tax\s+Statement[\s\S]{0,100}?(\d{4}-\d{2,4})/i,
    /(\d{4}-\d{2,4})/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return '2025-26';
}

function extractPAN(text) {
  const m = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
  return m ? m[1] : '';
}

function extractName(text) {
  // Form 26AS: "Name: SANDEEP LATI" or "Taxpayer Name: ..."
  const patterns = [
    /(?:Taxpayer\s+)?Name[:\s]+([A-Z][A-Z\s]{2,50}?)(?:\n|PAN|Address)/i,
    /Name\s+of\s+(?:the\s+)?(?:Taxpayer|Assessee)[:\s]+([A-Za-z][A-Za-z\s.]{2,50})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const name = m[1].trim();
      if (name.length > 2) return name;
    }
  }
  return '';
}

// ─── Part A: TDS Entries ──────────────────────────────────────────────────────

/**
 * Extract Part A TDS entries.
 * Each entry has: deductor name, TAN, total TDS, deposited TDS
 * Format varies: TRACES PDF has tabular data
 */
function extractPartA(text) {
  const entries = [];

  // Find Part A section
  const partAMatch = text.match(/PART\s*[-–]?\s*A[\s\S]*?(?=PART\s*[-–]?\s*[B-Z]|$)/i);
  const partAText = partAMatch ? partAMatch[0] : text;

  // Pattern: TAN (AAAA99999A) followed by deductor name and amounts
  // TRACES format: rows with TAN, name, section, amount, TDS
  const tanPattern = /([A-Z]{4}[0-9]{5}[A-Z])\s+([A-Za-z][A-Za-z\s&.,()-]{2,60}?)\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)/g;
  let match;
  while ((match = tanPattern.exec(partAText)) !== null) {
    const tds = parseNum(match[4]);
    if (tds > 0) {
      entries.push({
        tan: match[1],
        deductorName: match[2].trim(),
        amountPaid: parseNum(match[3]),
        tdsCredited: tds,
        section: '',
      });
    }
  }

  // If no structured entries found, try to extract total TDS from Part A
  if (entries.length === 0) {
    // Look for salary TDS entries
    const salaryTDSPatterns = [
      /192\s*[AB]?[\s\S]{0,200}?([\d,]+(?:\.\d{2})?)\s*(?:Total|$)/i,
      /Salary[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)/i,
    ];
    for (const p of salaryTDSPatterns) {
      const m = partAText.match(p);
      if (m) {
        const tds = parseNum(m[1]);
        if (tds > 10000) {
          entries.push({
            tan: '',
            deductorName: 'Employer (Salary)',
            amountPaid: 0,
            tdsCredited: tds,
            section: '192',
          });
          break;
        }
      }
    }
  }

  return entries;
}

/**
 * Extract total TDS from all parts of Form 26AS.
 * Looks for summary totals.
 */
function extractTotalTDS(text) {
  // Look for "Total Tax Deducted" or "Grand Total" in TDS sections
  const patterns = [
    /Total\s+Tax\s+Deducted[\s:]+([0-9,]+(?:\.\d{2})?)/i,
    /Grand\s+Total[\s\S]{0,50}?([\d,]+(?:\.\d{2})?)/i,
    /Total\s+TDS[\s:]+([0-9,]+(?:\.\d{2})?)/i,
    /Total\s+Amount\s+of\s+Tax\s+Deducted[\s:]+([0-9,]+(?:\.\d{2})?)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const val = parseNum(m[1]);
      if (val > 1000) return val;
    }
  }
  return 0;
}

// ─── Part C: Advance Tax & Self-Assessment Tax ────────────────────────────────

function extractPartC(text) {
  const payments = [];

  // Find Part C section
  const partCMatch = text.match(/PART\s*[-–]?\s*C[\s\S]*?(?=PART\s*[-–]?\s*[D-Z]|$)/i);
  const partCText = partCMatch ? partCMatch[0] : '';

  if (!partCText) return payments;

  // Advance Tax: BSR code, date, challan, amount
  // Pattern: date (DD/MM/YYYY or DD-MM-YYYY) followed by amount
  const dateAmountPattern = /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)\s+(?:Advance|Self)/gi;
  let match;
  while ((match = dateAmountPattern.exec(partCText)) !== null) {
    const amount = parseNum(match[2]);
    if (amount > 0) {
      payments.push({
        date: match[1],
        amount,
        type: match[0].toLowerCase().includes('advance') ? 'Advance Tax' : 'Self-Assessment Tax',
        bsrCode: '',
        challanNo: '',
      });
    }
  }

  // Extract totals
  const advanceTaxTotal = (() => {
    const m = partCText.match(/Advance\s+Tax[\s\S]{0,200}?Total[\s:]+([0-9,]+(?:\.\d{2})?)/i);
    if (m) return parseNum(m[1]);
    // Sum all advance tax entries
    let total = 0;
    const advPattern = /Advance\s+Tax[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)/gi;
    let am;
    while ((am = advPattern.exec(partCText)) !== null) {
      const v = parseNum(am[1]);
      if (v > 1000) total += v;
    }
    return total;
  })();

  const selfAssessmentTaxTotal = (() => {
    const m = partCText.match(/Self[\s-]Assessment\s+Tax[\s\S]{0,200}?Total[\s:]+([0-9,]+(?:\.\d{2})?)/i);
    if (m) return parseNum(m[1]);
    let total = 0;
    const saPattern = /Self[\s-]Assessment[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)/gi;
    let am;
    while ((am = saPattern.exec(partCText)) !== null) {
      const v = parseNum(am[1]);
      if (v > 1000) total += v;
    }
    return total;
  })();

  return { payments, advanceTaxTotal, selfAssessmentTaxTotal };
}

// ─── Part D: Refunds ──────────────────────────────────────────────────────────

function extractPartD(text) {
  const partDMatch = text.match(/PART\s*[-–]?\s*D[\s\S]*?(?=PART\s*[-–]?\s*[E-Z]|$)/i);
  const partDText = partDMatch ? partDMatch[0] : '';

  if (!partDText) return { refunds: [], totalRefund: 0 };

  const refunds = [];
  const refundPattern = /(\d{4}[-–]\d{2,4})\s+([\d,]+(?:\.\d{2})?)\s+([\d,]+(?:\.\d{2})?)/g;
  let match;
  while ((match = refundPattern.exec(partDText)) !== null) {
    const amount = parseNum(match[2]);
    if (amount > 0) {
      refunds.push({
        assessmentYear: match[1],
        refundAmount: amount,
        interest: parseNum(match[3]),
      });
    }
  }

  const totalRefund = refunds.reduce((sum, r) => sum + r.refundAmount, 0);
  return { refunds, totalRefund };
}

// ─── Part E/SFT: High-Value Transactions ─────────────────────────────────────

function extractHighValueTransactions(text) {
  const transactions = [];

  // Find Part E or SFT section
  const partEMatch = text.match(/(?:PART\s*[-–]?\s*E|SFT|AIR|Annual\s+Information)[\s\S]*?(?=PART\s*[-–]?\s*[F-Z]|$)/i);
  const partEText = partEMatch ? partEMatch[0] : '';

  if (!partEText) return transactions;

  // High-value transaction types
  const txnTypes = [
    { pattern: /(?:Cash\s+Deposit|Cash\s+Withdrawal)[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)/gi, type: 'Cash Deposit/Withdrawal' },
    { pattern: /(?:Mutual\s+Fund|MF)[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)/gi, type: 'Mutual Fund' },
    { pattern: /(?:Fixed\s+Deposit|FD)[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)/gi, type: 'Fixed Deposit' },
    { pattern: /(?:Property|Immovable)[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)/gi, type: 'Property Transaction' },
    { pattern: /(?:Credit\s+Card|CC)[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)/gi, type: 'Credit Card' },
    { pattern: /(?:Share|Equity|Stock)[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)/gi, type: 'Share/Equity' },
    { pattern: /(?:Bond|Debenture)[\s\S]{0,100}?([\d,]+(?:\.\d{2})?)/gi, type: 'Bond/Debenture' },
  ];

  for (const { pattern, type } of txnTypes) {
    let match;
    while ((match = pattern.exec(partEText)) !== null) {
      const amount = parseNum(match[1]);
      if (amount > 100000) { // Only significant transactions
        transactions.push({ type, amount });
        break; // One entry per type
      }
    }
  }

  return transactions;
}

// ─── TDS Reconciliation ───────────────────────────────────────────────────────

/**
 * Extract TDS by section (192 = salary, 194A = interest, 194C = contractor, etc.)
 */
function extractTDSBySection(text) {
  const bySection = {};

  const sectionPatterns = [
    { section: '192', label: 'Salary TDS', pattern: /192\s*[AB]?[\s\S]{0,300}?([\d,]+(?:\.\d{2})?)\s*(?:\n|Total)/i },
    { section: '194A', label: 'Interest (Bank/FD)', pattern: /194\s*A[\s\S]{0,200}?([\d,]+(?:\.\d{2})?)/i },
    { section: '194B', label: 'Lottery/Winnings', pattern: /194\s*B[\s\S]{0,200}?([\d,]+(?:\.\d{2})?)/i },
    { section: '194C', label: 'Contractor', pattern: /194\s*C[\s\S]{0,200}?([\d,]+(?:\.\d{2})?)/i },
    { section: '194D', label: 'Insurance Commission', pattern: /194\s*D[\s\S]{0,200}?([\d,]+(?:\.\d{2})?)/i },
    { section: '194H', label: 'Commission/Brokerage', pattern: /194\s*H[\s\S]{0,200}?([\d,]+(?:\.\d{2})?)/i },
    { section: '194I', label: 'Rent', pattern: /194\s*I[\s\S]{0,200}?([\d,]+(?:\.\d{2})?)/i },
    { section: '194J', label: 'Professional Fees', pattern: /194\s*J[\s\S]{0,200}?([\d,]+(?:\.\d{2})?)/i },
    { section: '194N', label: 'Cash Withdrawal', pattern: /194\s*N[\s\S]{0,200}?([\d,]+(?:\.\d{2})?)/i },
    { section: '194Q', label: 'Purchase of Goods', pattern: /194\s*Q[\s\S]{0,200}?([\d,]+(?:\.\d{2})?)/i },
  ];

  for (const { section, label, pattern } of sectionPatterns) {
    const m = text.match(pattern);
    if (m) {
      const val = parseNum(m[1]);
      if (val > 0) {
        bySection[section] = { label, amount: val };
      }
    }
  }

  return bySection;
}

// ─── Main extractor ───────────────────────────────────────────────────────────

function extractForm26ASData(text) {
  // Normalize whitespace
  const normalized = text.replace(/[ \t]+/g, ' ').replace(/\r\n/g, '\n');

  const pan = extractPAN(normalized);
  const name = extractName(normalized);
  const assessmentYear = extractAssessmentYear(normalized);

  const partAEntries = extractPartA(normalized);
  const partCData = extractPartC(normalized);
  const partDData = extractPartD(normalized);
  const highValueTransactions = extractHighValueTransactions(normalized);
  const tdsBySection = extractTDSBySection(normalized);

  // Calculate total TDS from Part A entries
  const totalTDSFromPartA = partAEntries.reduce((sum, e) => sum + (e.tdsCredited || 0), 0);

  // Try to get total TDS from summary if Part A parsing didn't find entries
  const totalTDSSummary = extractTotalTDS(normalized);
  const totalTDS = totalTDSFromPartA > 0 ? totalTDSFromPartA : totalTDSSummary;

  // Salary TDS (section 192)
  const salaryTDS = tdsBySection['192'] ? tdsBySection['192'].amount :
    partAEntries.filter(e => e.section === '192' || e.deductorName.toLowerCase().includes('employer') || e.deductorName.toLowerCase().includes('salary'))
      .reduce((sum, e) => sum + e.tdsCredited, 0);

  // Other TDS (interest, rent, etc.)
  const otherTDS = totalTDS - salaryTDS;

  // Total taxes paid
  const advanceTax = partCData.advanceTaxTotal || 0;
  const selfAssessmentTax = partCData.selfAssessmentTaxTotal || 0;
  const totalTaxesPaid = totalTDS + advanceTax + selfAssessmentTax;

  return {
    pan,
    name,
    assessmentYear,
    partA: {
      entries: partAEntries,
      totalTDS,
      salaryTDS,
      otherTDS,
    },
    partC: {
      advanceTax,
      selfAssessmentTax,
      payments: partCData.payments || [],
    },
    partD: partDData,
    highValueTransactions,
    tdsBySection,
    summary: {
      totalTDS,
      advanceTax,
      selfAssessmentTax,
      totalTaxesPaid,
      totalRefund: partDData.totalRefund || 0,
    },
    rawText: text,
  };
}

module.exports = { parseForm26AS, extractForm26ASData };

// Made with Bob