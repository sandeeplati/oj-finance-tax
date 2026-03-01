const pdfParse = require('pdf-parse');

/**
 * Parse Form 16 PDF and extract relevant tax information.
 * Supports TRACES, Saral TDS, Winman, ClearTax, and other common formats.
 * @param {Buffer} pdfBuffer - Raw PDF buffer
 * @param {string} [password] - Optional PDF password (usually employee's PAN number)
 */
async function parseForm16(pdfBuffer, password) {
  try {
    const input = password
      ? { data: new Uint8Array(pdfBuffer), password }
      : pdfBuffer;

    const data = await pdfParse(input);
    const text = data.text;
    return extractTaxData(text);
  } catch (error) {
    const msg = error.message || '';
    if (msg.includes('No password') || msg.includes('password') || msg.includes('encrypted')) {
      throw new Error('This PDF is password-protected. Please enter the PDF password (usually your PAN number in uppercase, e.g. ABCDE1234F).');
    }
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNum(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '').replace(/\s/g, '')) || 0;
}

/**
 * Try multiple regex patterns against text, return first match as number.
 * Patterns can use (?:[\s\S]{0,80}) to allow label and value on different lines.
 */
function extractNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseNum(match[1] || match[2] || '');
      if (val > 0) return val;
    }
  }
  return 0;
}

/**
 * Extract a number that appears after a label, allowing for:
 * - Same line: "Label: 12,345"
 * - Next line: "Label\n12,345"
 * - With spaces/tabs: "Label    12,345"
 * - With Rs/₹ prefix: "Label ₹12,345"
 */
function extractAfterLabel(text, labels) {
  for (const label of labels) {
    // Escape special regex chars in label
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Allow label followed by optional colon/space/newline then number
    const pattern = new RegExp(
      escaped + '[:\\s]*(?:Rs\\.?|₹)?\\s*([\\d,]+(?:\\.\\d{1,2})?)',
      'i'
    );
    const match = text.match(pattern);
    if (match) {
      const val = parseNum(match[1]);
      if (val > 0) return val;
    }
  }
  return 0;
}

// ─── Employee Info ────────────────────────────────────────────────────────────

function extractEmployeeInfo(text) {
  const info = { name: '', pan: '', designation: '', address: '' };

  // PAN: 10-char alphanumeric — prefer "PAN of the Employee" label
  const panEmpMatch = text.match(/PAN\s+of\s+(?:the\s+)?Employee[^A-Z]*([A-Z]{5}[0-9]{4}[A-Z])/i);
  if (panEmpMatch) {
    info.pan = panEmpMatch[1];
  } else {
    const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z])\b/);
    if (panMatch) info.pan = panMatch[1];
  }

  // Name patterns — IBM TRACES format: "Name and address of the Employee/Specified senior citizen\nSANDEEP LATI\n..."
  const namePatterns = [
    // IBM TRACES: after "Employee/Specified senior citizen" label, next line is the name
    /Employee\/Specified\s+senior\s+citizen\s*\n([A-Z][A-Z\s]{2,50})\n/,
    /Name\s+and\s+address\s+of\s+the\s+Employee[^\n]*\n([A-Z][A-Z\s]{2,50})\n/i,
    /Name\s+of\s+(?:the\s+)?Employee[:\s]+([A-Za-z][A-Za-z\s.]{2,50})/i,
    /Employee(?:'s)?\s+Name[:\s]+([A-Za-z][A-Za-z\s.]{2,50})/i,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m) {
      const candidate = m[1].trim().split(/\n/)[0].trim();
      // Skip generic words
      if (candidate.length > 2 && !candidate.match(/^(Form|Name|Employee|Employer|Certificate|Details|Income|Tax|Salary|PAN|TAN|Assessment)/i)) {
        info.name = candidate;
        break;
      }
    }
  }

  return info;
}

// ─── Employer Info ────────────────────────────────────────────────────────────

function extractEmployerInfo(text) {
  const info = { name: '', tan: '', address: '' };

  // TAN: 10-char format AAAA99999A — prefer "TAN of the Deductor" label
  const tanDedMatch = text.match(/TAN\s+of\s+(?:the\s+)?Deductor[^A-Z]*([A-Z]{4}[0-9]{5}[A-Z])/i);
  if (tanDedMatch) {
    info.tan = tanDedMatch[1];
  } else {
    const tanMatch = text.match(/\b([A-Z]{4}[0-9]{5}[A-Z])\b/);
    if (tanMatch) info.tan = tanMatch[1];
  }

  const namePatterns = [
    // IBM TRACES: "Name and address of the Employer/Specified Bank\nIBM INDIA PRIVATE LIMITED\n..."
    /Employer\/Specified\s+Bank\s*\n([A-Z][A-Z\s&.,()-]{2,80})\n/,
    /Name\s+and\s+address\s+of\s+the\s+Employer[^\n]*\n([A-Z][A-Z\s&.,()-]{2,80})\n/i,
    /Name\s+of\s+(?:the\s+)?(?:Employer|Deductor)[:\s]+([A-Za-z][A-Za-z\s&.,()-]{2,80})/i,
    /Employer(?:'s)?\s+Name[:\s]+([A-Za-z][A-Za-z\s&.,()-]{2,80})/i,
  ];
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m) {
      info.name = m[1].trim().split(/\n/)[0].trim();
      if (info.name.length > 2) break;
    }
  }

  return info;
}

// ─── Salary Details ───────────────────────────────────────────────────────────

function extractSalaryDetails(text) {
  // ── IBM TRACES format: label and number are concatenated without space ──
  // e.g. "Salary as per provisions contained in section 17(1)(a)6808042.00"
  // e.g. "(d)Total6885097.00"
  // e.g. "Income chargeable under the head \"Salaries\" [(3+1(e)-5]\n...\n6833297.00"

  // Gross Salary — IBM: section 17(1)(a) value OR (d)Total
  let grossSalary = extractNumber(text, [
    // IBM: "section 17(1)(a)6808042.00"
    /section\s+17\s*\(1\)\s*\(a\)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // IBM: "(d)Total6885097.00" — total salary including perquisites
    /\(d\)\s*Total\s*([\d,]+(?:\.\d{1,2})?)/i,
  ]) || extractAfterLabel(text, [
    'Gross Salary',
    'Total Gross Salary',
    'Gross salary as per provisions',
    'Gross Salary (a)',
    '1. Gross Salary',
    'a. Gross Salary',
  ]) || extractNumber(text, [
    /Gross\s+Salary[\s\S]{0,60}?([\d,]{4,})/i,
    /Total\s+Gross[\s\S]{0,40}?([\d,]{4,})/i,
  ]);

  // Basic Salary
  const basicSalary = extractAfterLabel(text, [
    'Basic Salary',
    'Basic Pay',
    'Basic',
    'Basic & DA',
    'Basic and DA',
    'Basic + DA',
  ]) || extractNumber(text, [
    /Basic\s+(?:Salary|Pay)?[\s:]+([0-9,]{4,})/i,
  ]);

  // HRA received (not exemption) — IBM format has no HRA component separately
  const hra = extractAfterLabel(text, [
    'House Rent Allowance',
    'HRA Received',
    'HRA',
    'H.R.A.',
  ]) || extractNumber(text, [
    /House\s+Rent\s+Allowance[\s\S]{0,40}?([\d,]{4,})/i,
    /\bHRA\b[\s:]+([0-9,]{4,})/i,
  ]);

  // Special Allowance
  const specialAllowance = extractAfterLabel(text, [
    'Special Allowance',
    'Special Pay',
    'Other Special Allowance',
  ]) || extractNumber(text, [
    /Special\s+Allowance[\s:]+([0-9,]{4,})/i,
  ]);

  // LTA
  const lta = extractAfterLabel(text, [
    'Leave Travel Allowance',
    'Leave Travel Concession',
    'LTA',
    'LTC',
  ]) || extractNumber(text, [
    /Leave\s+Travel[\s\S]{0,30}?([\d,]{4,})/i,
    /\bLTA\b[\s:]+([0-9,]{4,})/i,
  ]);

  // Medical Allowance
  const medicalAllowance = extractAfterLabel(text, [
    'Medical Allowance',
    'Medical Reimbursement',
  ]) || extractNumber(text, [
    /Medical\s+Allowance[\s:]+([0-9,]{4,})/i,
  ]);

  // Other Allowances
  const otherAllowances = extractAfterLabel(text, [
    'Other Allowances',
    'Other Allowance',
    'Conveyance Allowance',
    'Transport Allowance',
  ]) || extractNumber(text, [
    /Other\s+Allowances?[\s:]+([0-9,]{4,})/i,
  ]);

  // Perquisites — IBM: "(b)77055.00" (value of perquisites under section 17(2))
  const perquisites = extractNumber(text, [
    // IBM: perquisites appear as "(b)77055.00" right after section 17(1)(a) value
    /section\s+17\s*\(1\)\s*\(a\)[\d.,]+\s*\(b\)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // IBM: "Value of perquisites under section 17(2)...\n(b)77055.00"
    /Value\s+of\s+perquisites[\s\S]{0,200}?\(b\)\s*([\d,]+(?:\.\d{1,2})?)/i,
  ]) || extractAfterLabel(text, [
    'Perquisites',
    'Value of Perquisites',
    'Perquisite',
  ]) || extractNumber(text, [
    /Perquisites?[\s\S]{0,40}?([\d,]{4,})/i,
  ]);

  // Net Salary / Taxable Salary
  // IBM: "Income chargeable under the head \"Salaries\" [(3+1(e)-5]\n...\n6833297.00\n6."
  // Also appears as "6833297.006." (number followed by section number)
  const netSalary = extractNumber(text, [
    // IBM: number followed by "\n6." (section 6 marker)
    /([\d,]+(?:\.\d{1,2})?)(?:\n|\s*)6\.\s*\n/,
    // IBM: "6833297.006." — number directly followed by "6."
    /([\d,]+\.\d{2})6\.\s/,
    // IBM: total salary from current employer = (d)Total - deductions
    // "Total amount of salary received from current employer\n...\n6885097.00"
    /Total\s+amount\s+of\s+salary\s+received\s+from\s+current\s+employer[\s\S]{0,100}?([\d,]+(?:\.\d{1,2})?)/i,
  ]) || extractAfterLabel(text, [
    'Net Salary',
    'Taxable Salary',
    'Income chargeable under the head Salaries',
    'Income under the head Salaries',
    'Total Income from Salary',
  ]) || extractNumber(text, [
    /Net\s+Salary[\s:]+([0-9,]{4,})/i,
    /Income\s+chargeable[\s\S]{0,60}?([\d,]{5,})/i,
  ]);

  return { grossSalary, basicSalary, hra, specialAllowance, lta, medicalAllowance, otherAllowances, perquisites, netSalary };
}

// ─── Deductions ───────────────────────────────────────────────────────────────

function extractDeductions(text) {
  // ── IBM TRACES format notes ──
  // Standard deduction: "(a)50000.00" appears after "Standard deduction under section 16(ia)"
  // Professional tax: "Tax on employment under section 16(iii)1800.00(c)"
  // HRA exemption: "House rent allowance under section 10(13A)" followed by value on next line
  // Home loan interest: "(a)-200000.00" (negative = loss from house property)
  // 80C: appears in Part B deductions section

  // Standard Deduction — IBM: "(a)50000.00" after section 16(ia) label
  const standardDeduction = extractNumber(text, [
    // IBM: "Standard deduction under section 16(ia)\n...\n(a)50000.00"
    /Standard\s+deduction\s+under\s+section\s+16\s*\(ia\)[\s\S]{0,100}?\(a\)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // IBM: "(a)50000.00\n(b)" pattern in deductions section
    /16\s*\(ia\)[\s\S]{0,50}?\(a\)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // Standard: label followed by value
    /Standard\s+[Dd]eduction[\s\S]{0,60}?([\d,]{4,})/i,
    /16\s*\(ia\)[\s\S]{0,40}?([\d,]{4,})/i,
  ]) || extractAfterLabel(text, [
    'Standard Deduction',
    'Standard deduction u/s 16(ia)',
    'Standard deduction under section 16(ia)',
    'Deduction u/s 16(ia)',
  ]);

  // Professional Tax — IBM: "Tax on employment under section 16(iii)1800.00(c)"
  const professionalTax = extractNumber(text, [
    // IBM: label+value concatenated
    /Tax\s+on\s+employment\s+under\s+section\s+16\s*\(iii\)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /Professional\s+Tax[\s:]+([0-9,]{2,})/i,
    /Tax\s+on\s+Employment[\s:]+([0-9,]{2,})/i,
    /16\s*\(iii\)\s*([\d,]+(?:\.\d{1,2})?)/i,
  ]) || extractAfterLabel(text, [
    'Professional Tax',
    'Tax on Employment',
    'Deduction u/s 16(iii)',
  ]);

  // HRA Exemption — IBM: "House rent allowance under section 10(13A)" then value on SAME line
  // IBM format: "House rent allowance under section 10(13A)\n0.00\n" (value on next line)
  // The value after "10(13A)" label — must be a 4+ digit number to be meaningful
  // If 0, return 0 (not the section number "10")
  const hraExemption = (() => {
    // IBM: look for the HRA exemption value — it appears right after the 10(13A) label
    // Pattern: "House rent allowance under section 10(13A)\n(value)\n"
    const m = text.match(/House\s+rent\s+allowance\s+under\s+section\s+10\s*\(13A\)[\s\S]{0,10}?\n\s*([\d,]+(?:\.\d{1,2})?)\s*\n/i);
    if (m) {
      const val = parseNum(m[1]);
      return val; // return 0 if 0.00
    }
    // Standard patterns — only match 4+ digit values
    const patterns = [
      /HRA\s+Exempt(?:ion)?[\s:]+([0-9,]{4,})/i,
      /Exempt\s+HRA[\s:]+([0-9,]{4,})/i,
    ];
    for (const p of patterns) {
      const match = text.match(p);
      if (match) {
        const val = parseNum(match[1]);
        if (val > 0) return val;
      }
    }
    return 0;
  })();

  // Section 80C — IBM TRACES format:
  // "Deduction in respect of life insurance premia, contributions to\nprovident fund etc. under section 80C\n0.00\n"
  // The value appears on the line AFTER "section 80C" (not 80CCC or 80CCD)
  const section80C = (() => {
    // IBM: "section 80C\n<value>\n" — value on next line after label
    const m1 = text.match(/section\s+80C\s*\n\s*([\d,]+(?:\.\d{1,2})?)\s*\n/i);
    if (m1) {
      const val = parseNum(m1[1]);
      if (val >= 0) return val; // return 0 if explicitly 0
    }
    // IBM: "under section 80C\n<value>" — value on next line
    const m2 = text.match(/under\s+section\s+80C\s*\n\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (m2) {
      const val = parseNum(m2[1]);
      return val;
    }
    // Standard patterns — also exclude 80CCD
    const patterns = [
      /(?:Section\s+)?80C(?!C|D)[\s:,)]+([0-9,]{4,})/i,
      /Deduction\s+u\/s\s+80C(?!C|D)[\s:,)]+([0-9,]{4,})/i,
    ];
    for (const p of patterns) {
      const match = text.match(p);
      if (match) {
        const val = parseNum(match[1]);
        if (val > 0 && val <= 150000) return val;
      }
    }
    return 0;
  })();

  // Section 80D — IBM: "80D" followed by amount
  // Must be a reasonable health insurance amount (< 100000)
  const section80D = (() => {
    const m1 = text.match(/\b80D\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (m1) {
      const val = parseNum(m1[1]);
      if (val > 0 && val <= 100000) return val; // 80D max is 100000
    }
    const patterns = [
      /(?:Section\s+)?80D[\s:,)]+([0-9,]{3,})/i,
    ];
    for (const p of patterns) {
      const match = text.match(p);
      if (match) {
        const val = parseNum(match[1]);
        if (val > 0 && val <= 100000) return val;
      }
    }
    return 0;
  })();

  // NPS — IBM TRACES format:
  // 80CCD(1B) employee: "section 80CCD (1B)\n(a)\n35107.00\n"
  // 80CCD(2) employer: "section 80CCD (2)\n...\n150000.00\n" (appears after (g) marker)
  // We prefer 80CCD(2) employer contribution (larger, more common in Form 16)
  const nps = (() => {
    // IBM: 80CCD(2) employer NPS — "section 80CCD (2)\n" then value after "(g)\n"
    // Pattern: "80CCD (2)" label, then "(g)\n<value>\n"
    const m2g = text.match(/80CCD\s*\(2\)[\s\S]{0,100}?\(g\)\s*\n\s*([\d,]+(?:\.\d{1,2})?)\s*\n/i);
    if (m2g) {
      const val = parseNum(m2g[1]);
      if (val > 0) return val;
    }
    // IBM: "(g)\n150000.00\n" after 80CCD(2) section — look for (g) marker with value
    // The structure is: "80CCD (1B)\n(a)\n35107.00\n(b)\nTotal deduction under section 80C, 80CCC and 80CCD(1)\n(c)\n(g)\n150000.00\n"
    const m2 = text.match(/Total\s+deduction\s+under\s+section\s+80C[\s\S]{0,50}?\(g\)\s*\n\s*([\d,]+(?:\.\d{1,2})?)\s*\n/i);
    if (m2) {
      const val = parseNum(m2[1]);
      if (val > 0) return val;
    }
    // IBM: 80CCD(2) employer NPS contribution — value on next line after label
    const m2b = text.match(/section\s+80CCD\s*\(2\)\s*\n[\s\S]{0,50}?([\d,]+(?:\.\d{1,2})?)\s*\n/i);
    if (m2b) {
      const val = parseNum(m2b[1]);
      if (val > 0) return val;
    }
    // IBM: 80CCD(1B) employee NPS contribution — "section 80CCD (1B)\n(a)\n35107.00"
    const m1b = text.match(/section\s+80CCD\s*\(1B\)\s*\n\s*\(a\)\s*\n\s*([\d,]+(?:\.\d{1,2})?)/i);
    if (m1b) {
      const val = parseNum(m1b[1]);
      if (val > 0) return val;
    }
    const patterns = [
      /NPS[\s:]+([0-9,]{3,})/i,
      /National\s+Pension[\s\S]{0,40}?([\d,]{3,})/i,
    ];
    for (const p of patterns) {
      const match = text.match(p);
      if (match) {
        const val = parseNum(match[1]);
        if (val > 0) return val;
      }
    }
    return 0;
  })();

  // Section 80G
  const section80G = extractNumber(text, [
    /\b80G\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Section\s+)?80G[\s:,)]+([0-9,]{3,})/i,
  ]) || extractAfterLabel(text, [
    'Section 80G',
    '80G',
    'Donations',
  ]);

  // Section 80E
  const section80E = extractNumber(text, [
    /\b80E\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:Section\s+)?80E[\s:,)]+([0-9,]{3,})/i,
  ]) || extractAfterLabel(text, [
    'Section 80E',
    '80E',
    'Education Loan',
  ]);

  // Section 80TTA
  const section80TTA = extractNumber(text, [
    /\b80TTA\s*([\d,]+(?:\.\d{1,2})?)/i,
    /80TTA[\s:]+([0-9,]{3,})/i,
  ]) || extractAfterLabel(text, [
    'Section 80TTA',
    '80TTA',
    'Savings Account Interest',
  ]);

  // Home Loan Interest — IBM: "(a)-200000.00" (negative value = loss from house property)
  // The value is stored as positive in our system
  const homeLoanInterest = (() => {
    // IBM: "(a)-200000.00" appears in the "Income (or admissible loss) from house property" section
    // The text shows: "(a)-200000.00\n(b)\nIncome (or admissible loss) from"
    const m1 = text.match(/\(a\)\s*-\s*([\d,]+(?:\.\d{1,2})?)/);
    if (m1) {
      const val = parseNum(m1[1]);
      if (val >= 10000 && val <= 300000) return val;
    }
    // Standard patterns
    const patterns = [
      /Income\s*\(or\s+admissible\s+loss\)\s+from[\s\S]{0,100}?-\s*([\d,]+(?:\.\d{1,2})?)/i,
      /house\s+property[\s\S]{0,100}?-\s*([\d,]+(?:\.\d{1,2})?)/i,
      /24\s*\(b\)[\s\S]{0,40}?([\d,]{4,})/i,
      /Home\s+Loan\s+Interest[\s:]+([0-9,]{4,})/i,
      /Loss\s+from\s+House\s+Property[\s\S]{0,40}?([\d,]{4,})/i,
    ];
    for (const p of patterns) {
      const match = text.match(p);
      if (match) {
        const val = parseNum(match[1]);
        if (val >= 10000) return val;
      }
    }
    return 0;
  })();

  // Total Deductions
  const totalDeductions = extractNumber(text, [
    /Total\s+Deductions?[\s:]+([0-9,]{4,})/i,
    /Total\s+Exemptions?[\s:]+([0-9,]{4,})/i,
    /Aggregate\s+of\s+deductible[\s\S]{0,60}?([\d,]{4,})/i,
  ]) || extractAfterLabel(text, [
    'Total Deductions',
    'Total Exemptions and Deductions',
    'Aggregate of deductible amount',
    'Total amount of deductions',
  ]);

  return {
    standardDeduction,
    professionalTax,
    hraExemption,
    section80C,
    section80D,
    nps,
    section80G,
    section80E,
    section80TTA,
    homeLoanInterest,
    totalDeductions,
  };
}

// ─── Tax Details ──────────────────────────────────────────────────────────────

function extractTaxDetails(text) {
  // ── IBM TRACES format notes ──
  // TDS: "Total (Rs.)1937361.001937361.006885096.52" — first number after "Total (Rs.)" is TDS
  // Also in certificate text: "a sum of Rs. 1937361.00 ... has been deducted"
  // Taxable income: appears in Part B after all deductions
  // Tax payable: appears in Part B computation section

  // Taxable Income — IBM: "6269988.00Total taxable income (9-11)"
  // The number appears BEFORE the label "Total taxable income"
  const taxableIncome = (() => {
    // IBM: number immediately before "Total taxable income"
    const m1 = text.match(/([\d,]+(?:\.\d{1,2})?)Total\s+taxable\s+income/i);
    if (m1) {
      const val = parseNum(m1[1]);
      if (val > 100000) return val;
    }
    // IBM: "Gross total income" — number before label
    const m2 = text.match(/([\d,]+(?:\.\d{1,2})?)Gross\s+total\s+income/i);
    if (m2) {
      const val = parseNum(m2[1]);
      if (val > 100000) return val;
    }
    // Standard patterns
    const patterns = [
      /Gross\s+Total\s+Income[\s\S]{0,60}?([\d,]{6,})/i,
      /Total\s+taxable\s+income[\s\S]{0,60}?([\d,]{6,})/i,
      /Taxable\s+Income[\s:]+([0-9,]{6,})/i,
      /Net\s+Taxable[\s:]+([0-9,]{6,})/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        const val = parseNum(m[1]);
        if (val > 100000) return val;
      }
    }
    return 0;
  })();

  // Tax Payable / Income Tax — IBM TRACES format:
  // "Tax on total income\n363309.0011.\n13.\n12.\n1693497.00\n6269988.00Total taxable income"
  // The tax payable (1693497) appears between "13." and "6269988.00Total taxable income"
  // Note: 363309 is the Chapter VI-A aggregate, NOT the tax payable
  const taxPayable = (() => {
    // IBM: "13.\n12.\n<taxPayable>\n<taxableIncome>Total taxable income"
    // Pattern: number on its own line immediately before "<number>Total taxable income"
    const m1 = text.match(/\b13\.\s*\n\s*12\.\s*\n\s*([\d,]+(?:\.\d{1,2})?)\s*\n\s*[\d,]+(?:\.\d{1,2})?Total\s+taxable\s+income/i);
    if (m1) {
      const val = parseNum(m1[1]);
      if (val > 10000) return val;
    }
    // IBM: number on line just before "<number>Total taxable income"
    const m2 = text.match(/([\d,]+(?:\.\d{1,2})?)\s*\n\s*([\d,]+(?:\.\d{1,2})?)Total\s+taxable\s+income/i);
    if (m2) {
      const val = parseNum(m2[1]);
      if (val > 10000 && val < 5000000) return val;
    }
    const patterns = [
      /Tax\s+on\s+total\s+income\s*\n[\s\S]{0,100}?\n\s*([\d,]+(?:\.\d{1,2})?)\s*\n/i,
      /Tax\s+on\s+Total\s+Income[\s\S]{0,60}?([\d,]{5,})/i,
      /Tax\s+at\s+Normal\s+Rate[\s\S]{0,60}?([\d,]{5,})/i,
      /Tax\s+Payable[\s:]+([0-9,]{5,})/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        const val = parseNum(m[1]);
        if (val > 10000) return val;
      }
    }
    return 0;
  })();

  // Surcharge — IBM: "15.169350.00" (section 15 = surcharge)
  const surcharge = (() => {
    // IBM: number after "15." section marker
    const m1 = text.match(/\b15\.\s*([\d,]+(?:\.\d{1,2})?)/);
    if (m1) {
      const val = parseNum(m1[1]);
      if (val > 0 && val < 2000000) return val;
    }
    const patterns = [
      /Surcharge[\s:]+([0-9,]{2,})/i,
      /Surcharge\s*([\d,]+(?:\.\d{1,2})?)/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        const val = parseNum(m[1]);
        if (val > 0) return val;
      }
    }
    return 0;
  })();

  // Education Cess — IBM: "16.74514.00" (section 16 = cess)
  const educationCess = (() => {
    // IBM: number after "16." section marker
    const m1 = text.match(/\b16\.\s*([\d,]+(?:\.\d{1,2})?)/);
    if (m1) {
      const val = parseNum(m1[1]);
      if (val > 0 && val < 500000) return val;
    }
    const patterns = [
      /(?:Health\s+(?:and|&)\s+)?Education\s+Cess[\s:]+([0-9,]{2,})/i,
      /\bCess\b[\s:]+([0-9,]{2,})/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        const val = parseNum(m[1]);
        if (val > 0) return val;
      }
    }
    return 0;
  })();

  // Total Tax — IBM: surcharge + cess + tax on income
  const totalTax = (() => {
    const patterns = [
      /Total\s+Tax[\s:]+([0-9,]{3,})/i,
      /Tax\s+Payable\s+\(including[\s\S]{0,40}?([\d,]{4,})/i,
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m) {
        const val = parseNum(m[1]);
        if (val > 0) return val;
      }
    }
    return 0;
  })();

  // TDS Paid — IBM TRACES specific patterns:
  // 1. "Total (Rs.)1937361.001937361.006885096.52" — first number after "Total (Rs.)"
  // 2. "a sum of Rs. 1937361.00 ... has been deducted"
  // 3. Standard patterns
  const tdsPaid = extractNumber(text, [
    // IBM TRACES Part A: "Total (Rs.)1937361.00" — TDS total at end of challan table
    /Total\s*\(Rs\.\)\s*([\d,]+(?:\.\d{1,2})?)/i,
    // IBM certificate text: "a sum of Rs. 1937361.00 [Rs. ... has been deducted"
    /a\s+sum\s+of\s+Rs\.?\s*([\d,]+(?:\.\d{1,2})?)\s*[\[\(]/i,
    // Standard patterns
    /Tax\s+Deducted\s+at\s+Source[\s\S]{0,60}?([\d,]{4,})/i,
    /Total\s+TDS[\s:]+([0-9,]{4,})/i,
    /Amount\s+of\s+(?:Tax|TDS)\s+Deducted[\s\S]{0,40}?([\d,]{4,})/i,
    /TDS\s+Deducted[\s:]+([0-9,]{4,})/i,
  ]) || extractAfterLabel(text, [
    'Tax Deducted at Source',
    'TDS Deducted',
    'Total TDS',
    'Amount of Tax Deducted',
    'Tax Deducted',
  ]);

  // Tax Refund
  const taxRefund = extractNumber(text, [
    /Refund[\s:]+([0-9,]{3,})/i,
  ]) || extractAfterLabel(text, ['Refund', 'Tax Refund']);

  // Assessment Year
  const assessmentYear = extractAssessmentYear(text);

  // New regime flag — IBM: "Whether opting out of taxation u/s 115BAC(1A)?Yes"
  const newRegime = /opting\s+out\s+of\s+taxation\s+u\/s\s+115BAC[\s\S]{0,20}?Yes/i.test(text) ||
    /115BAC[\s\S]{0,30}?Yes/i.test(text);

  return { taxableIncome, taxPayable, surcharge, educationCess, totalTax, tdsPaid, taxRefund, assessmentYear, newRegime };
}

function extractAssessmentYear(text) {
  const patterns = [
    /Assessment\s+Year[:\s]+(\d{4}[-–]\d{2,4})/i,
    /A\.?Y\.?[:\s]+(\d{4}[-–]\d{2,4})/i,
    /AY[:\s]+(\d{4}[-–]\d{2,4})/i,
    /(\d{4}[-–]\d{2,4})\s*(?:Assessment|A\.Y\.)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return '2025-26';
}

// ─── Smart fallback: derive missing values ────────────────────────────────────

function deriveAndFill(data) {
  const s = data.salaryDetails;
  const d = data.deductions;
  const t = data.taxDetails;

  // If grossSalary is 0 but we have components, sum them
  if (!s.grossSalary && (s.basicSalary || s.hra || s.specialAllowance)) {
    s.grossSalary = (s.basicSalary || 0) + (s.hra || 0) + (s.specialAllowance || 0) +
      (s.lta || 0) + (s.medicalAllowance || 0) + (s.otherAllowances || 0) + (s.perquisites || 0);
  }

  // If netSalary is 0, use taxableIncome from tax details (only if taxableIncome is large enough)
  if (!s.netSalary && t.taxableIncome && t.taxableIncome > 100000) {
    s.netSalary = t.taxableIncome;
  }

  // If grossSalary is still 0, use netSalary
  if (!s.grossSalary && s.netSalary) {
    s.grossSalary = s.netSalary;
  }

  // Standard deduction default for FY 2024-25
  if (!d.standardDeduction && s.grossSalary > 0) {
    d.standardDeduction = 50000;
  }

  // If TDS is 0 but totalTax is set, use totalTax as TDS estimate
  if (!t.tdsPaid && t.totalTax) {
    t.tdsPaid = t.totalTax;
  }

  // Derive taxable income if not found or too small
  // For new regime: taxableIncome = netSalary - standardDeduction - homeLoanInterest (loss)
  // For old regime: taxableIncome = netSalary - standardDeduction - 80C - 80D - NPS - homeLoanInterest
  if (!t.taxableIncome || t.taxableIncome < 100000) {
    const netSal = s.netSalary || s.grossSalary || 0;
    if (netSal > 0) {
      const stdDed = d.standardDeduction || 50000;
      const profTax = d.professionalTax || 0;
      const homeLoan = d.homeLoanInterest || 0;
      if (t.newRegime) {
        // New regime: only standard deduction and professional tax
        t.taxableIncome = Math.max(0, netSal - stdDed - profTax - homeLoan);
      } else {
        // Old regime: all deductions
        const chap6A = (d.section80C || 0) + (d.section80D || 0) + (d.nps || 0) +
          (d.section80G || 0) + (d.section80E || 0) + (d.section80TTA || 0);
        t.taxableIncome = Math.max(0, netSal - stdDed - profTax - homeLoan - chap6A);
      }
    }
  }

  return data;
}

// ─── Main extractor ───────────────────────────────────────────────────────────

function extractTaxData(text) {
  // Normalize: collapse multiple spaces, but keep newlines for context
  const normalized = text.replace(/[ \t]+/g, ' ').replace(/\r\n/g, '\n');

  const data = {
    employeeInfo: extractEmployeeInfo(normalized),
    employerInfo: extractEmployerInfo(normalized),
    salaryDetails: extractSalaryDetails(normalized),
    deductions: extractDeductions(normalized),
    taxDetails: extractTaxDetails(normalized),
    rawText: text,
  };

  return deriveAndFill(data);
}

module.exports = { parseForm16, extractTaxData };

// Made with Bob
