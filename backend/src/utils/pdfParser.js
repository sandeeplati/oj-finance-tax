const pdfParse = require('pdf-parse');

/**
 * Parse Form 16 PDF and extract relevant tax information
 */
async function parseForm16(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    const text = data.text;
    return extractTaxData(text);
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

function extractTaxData(text) {
  return {
    employeeInfo: extractEmployeeInfo(text),
    employerInfo: extractEmployerInfo(text),
    salaryDetails: extractSalaryDetails(text),
    deductions: extractDeductions(text),
    taxDetails: extractTaxDetails(text),
    rawText: text
  };
}

function extractEmployeeInfo(text) {
  const info = { name: '', pan: '', designation: '', address: '' };
  const panMatch = text.match(/PAN[:\s]+([A-Z]{5}[0-9]{4}[A-Z]{1})/i);
  if (panMatch) info.pan = panMatch[1];
  const namePatterns = [
    /Name of Employee[:\s]+([A-Za-z\s]+)/i,
    /Employee Name[:\s]+([A-Za-z\s]+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) { info.name = match[1].trim().split('\n')[0]; break; }
  }
  return info;
}

function extractEmployerInfo(text) {
  const info = { name: '', tan: '', address: '' };
  const tanMatch = text.match(/TAN[:\s]+([A-Z]{4}[0-9]{5}[A-Z]{1})/i);
  if (tanMatch) info.tan = tanMatch[1];
  const namePatterns = [
    /Name of Employer[:\s]+([A-Za-z\s&.,]+)/i,
    /Employer Name[:\s]+([A-Za-z\s&.,]+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) { info.name = match[1].trim().split('\n')[0]; break; }
  }
  return info;
}

function extractNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseFloat(match[1].replace(/,/g, '')) || 0;
  }
  return 0;
}

function extractSalaryDetails(text) {
  return {
    grossSalary: extractNumber(text, [/Gross Salary[:\s]+([\d,]+)/i, /Total Gross[:\s]+([\d,]+)/i]),
    basicSalary: extractNumber(text, [/Basic Salary[:\s]+([\d,]+)/i, /Basic[:\s]+([\d,]+)/i]),
    hra: extractNumber(text, [/House Rent Allowance[:\s]+([\d,]+)/i, /HRA[:\s]+([\d,]+)/i]),
    specialAllowance: extractNumber(text, [/Special Allowance[:\s]+([\d,]+)/i]),
    lta: extractNumber(text, [/Leave Travel Allowance[:\s]+([\d,]+)/i, /LTA[:\s]+([\d,]+)/i]),
    medicalAllowance: extractNumber(text, [/Medical Allowance[:\s]+([\d,]+)/i]),
    otherAllowances: extractNumber(text, [/Other Allowances[:\s]+([\d,]+)/i]),
    perquisites: extractNumber(text, [/Perquisites[:\s]+([\d,]+)/i]),
    netSalary: extractNumber(text, [/Net Salary[:\s]+([\d,]+)/i, /Total Income[:\s]+([\d,]+)/i])
  };
}

function extractDeductions(text) {
  return {
    section80C: extractNumber(text, [/80C[:\s]+([\d,]+)/i, /Section 80C[:\s]+([\d,]+)/i]),
    section80D: extractNumber(text, [/80D[:\s]+([\d,]+)/i, /Section 80D[:\s]+([\d,]+)/i]),
    section80G: extractNumber(text, [/80G[:\s]+([\d,]+)/i]),
    section80E: extractNumber(text, [/80E[:\s]+([\d,]+)/i]),
    section80TTA: extractNumber(text, [/80TTA[:\s]+([\d,]+)/i]),
    nps: extractNumber(text, [/NPS[:\s]+([\d,]+)/i, /National Pension[:\s]+([\d,]+)/i]),
    standardDeduction: extractNumber(text, [/Standard Deduction[:\s]+([\d,]+)/i]),
    professionalTax: extractNumber(text, [/Professional Tax[:\s]+([\d,]+)/i]),
    hraExemption: extractNumber(text, [/HRA Exemption[:\s]+([\d,]+)/i, /Exempt HRA[:\s]+([\d,]+)/i]),
    totalDeductions: extractNumber(text, [/Total Deductions[:\s]+([\d,]+)/i, /Total Exemptions[:\s]+([\d,]+)/i])
  };
}

function extractTaxDetails(text) {
  return {
    taxableIncome: extractNumber(text, [/Taxable Income[:\s]+([\d,]+)/i, /Total Taxable[:\s]+([\d,]+)/i]),
    taxPayable: extractNumber(text, [/Tax Payable[:\s]+([\d,]+)/i, /Income Tax[:\s]+([\d,]+)/i]),
    surcharge: extractNumber(text, [/Surcharge[:\s]+([\d,]+)/i]),
    educationCess: extractNumber(text, [/Education Cess[:\s]+([\d,]+)/i, /Health.*Cess[:\s]+([\d,]+)/i]),
    totalTax: extractNumber(text, [/Total Tax[:\s]+([\d,]+)/i]),
    tdsPaid: extractNumber(text, [/TDS[:\s]+([\d,]+)/i, /Tax Deducted[:\s]+([\d,]+)/i]),
    taxRefund: extractNumber(text, [/Refund[:\s]+([\d,]+)/i]),
    assessmentYear: extractAssessmentYear(text)
  };
}

function extractAssessmentYear(text) {
  const match = text.match(/Assessment Year[:\s]+(\d{4}-\d{2,4})/i) ||
                text.match(/A\.Y\.[:\s]+(\d{4}-\d{2,4})/i);
  return match ? match[1] : '2024-25';
}

module.exports = { parseForm16, extractTaxData };

// Made with Bob
