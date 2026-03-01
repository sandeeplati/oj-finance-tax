const express = require('express');
const multer = require('multer');
const router = express.Router();
const { parseForm16 } = require('../utils/pdfParser');
const { compareTaxRegimes } = require('../utils/taxCalculator');
const { generateRecommendations, generateTaxSummary } = require('../utils/recommendationEngine');

// Configure multer for PDF uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

/**
 * Merge multiple parsed Form 16 data objects into a single combined taxData.
 * Salary components are summed across employers.
 * Deductions are taken from the last/largest employer (they are personal, not per-employer).
 * TDS paid is summed across all employers.
 */
function mergeMultipleForm16(parsedList) {
  const merged = {
    employeeInfo: parsedList[0].employeeInfo,
    employers: parsedList.map((p, i) => ({
      index: i + 1,
      employerInfo: p.employerInfo,
      salaryDetails: p.salaryDetails,
      taxDetails: {
        tdsPaid: p.taxDetails.tdsPaid || 0,
        assessmentYear: p.taxDetails.assessmentYear,
      },
    })),
    salaryDetails: {
      grossSalary: 0,
      basicSalary: 0,
      hra: 0,
      specialAllowance: 0,
      lta: 0,
      medicalAllowance: 0,
      otherAllowances: 0,
      perquisites: 0,
      netSalary: 0,
    },
    deductions: parsedList[parsedList.length - 1].deductions, // personal deductions from last Form 16
    taxDetails: {
      tdsPaid: 0,
      assessmentYear: parsedList[0].taxDetails.assessmentYear,
    },
  };

  // Sum salary components and TDS across all employers
  for (const parsed of parsedList) {
    const s = parsed.salaryDetails;
    merged.salaryDetails.grossSalary += s.grossSalary || 0;
    merged.salaryDetails.basicSalary += s.basicSalary || 0;
    merged.salaryDetails.hra += s.hra || 0;
    merged.salaryDetails.specialAllowance += s.specialAllowance || 0;
    merged.salaryDetails.lta += s.lta || 0;
    merged.salaryDetails.medicalAllowance += s.medicalAllowance || 0;
    merged.salaryDetails.otherAllowances += s.otherAllowances || 0;
    merged.salaryDetails.perquisites += s.perquisites || 0;
    merged.salaryDetails.netSalary += s.netSalary || 0;
    merged.taxDetails.tdsPaid += parsed.taxDetails.tdsPaid || 0;
  }

  return merged;
}

// POST /api/tax/upload - Upload and parse single Form 16
router.post('/upload', upload.single('form16'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const age = parseInt(req.body.age) || 30;
    const password = req.body.password || '';   // optional PDF password
    const taxData = await parseForm16(req.file.buffer, password || undefined);
    const comparisonResult = compareTaxRegimes(taxData, age);
    const recommendations = generateRecommendations(taxData, comparisonResult, age);
    const summary = generateTaxSummary(taxData, comparisonResult);

    res.json({
      success: true,
      data: {
        taxData,
        comparisonResult,
        recommendations,
        summary
      }
    });
  } catch (error) {
    console.error('Error processing Form 16:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tax/upload-multiple - Upload and parse multiple Form 16s (multiple employers)
router.post('/upload-multiple', upload.array('form16s', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No PDF files uploaded' });
    }

    const age = parseInt(req.body.age) || 30;

    // passwords[] array — one password per file (empty string = no password)
    const rawPasswords = req.body.passwords;
    const passwords = Array.isArray(rawPasswords)
      ? rawPasswords
      : rawPasswords
        ? [rawPasswords]
        : [];

    // Parse all uploaded PDFs (with individual passwords)
    const parsedList = await Promise.all(
      req.files.map((file, i) => {
        const pw = passwords[i] || '';
        return parseForm16(file.buffer, pw || undefined);
      })
    );

    // Merge into a single combined taxData
    const taxData = parsedList.length === 1
      ? parsedList[0]
      : mergeMultipleForm16(parsedList);

    const comparisonResult = compareTaxRegimes(taxData, age);
    const recommendations = generateRecommendations(taxData, comparisonResult, age);
    const summary = generateTaxSummary(taxData, comparisonResult);

    res.json({
      success: true,
      data: {
        taxData,
        comparisonResult,
        recommendations,
        summary,
        multipleEmployers: parsedList.length > 1,
        employerCount: parsedList.length,
      }
    });
  } catch (error) {
    console.error('Error processing multiple Form 16s:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tax/calculate - Manual tax calculation
router.post('/calculate', async (req, res) => {
  try {
    const { taxData, age = 30 } = req.body;
    if (!taxData) {
      return res.status(400).json({ success: false, error: 'Tax data is required' });
    }

    const comparisonResult = compareTaxRegimes(taxData, age);
    const recommendations = generateRecommendations(taxData, comparisonResult, age);
    const summary = generateTaxSummary(taxData, comparisonResult);

    res.json({
      success: true,
      data: { taxData, comparisonResult, recommendations, summary }
    });
  } catch (error) {
    console.error('Error calculating tax:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tax/slabs - Get current tax slabs
router.get('/slabs', (req, res) => {
  res.json({
    success: true,
    data: {
      financialYear: '2024-25',
      assessmentYear: '2025-26',
      oldRegime: {
        slabs: [
          { range: 'Up to ₹2,50,000', rate: '0%' },
          { range: '₹2,50,001 - ₹5,00,000', rate: '5%' },
          { range: '₹5,00,001 - ₹10,00,000', rate: '20%' },
          { range: 'Above ₹10,00,000', rate: '30%' }
        ],
        standardDeduction: 50000,
        rebate87A: 'Up to ₹12,500 for income ≤ ₹5,00,000'
      },
      newRegime: {
        slabs: [
          { range: 'Up to ₹3,00,000', rate: '0%' },
          { range: '₹3,00,001 - ₹7,00,000', rate: '5%' },
          { range: '₹7,00,001 - ₹10,00,000', rate: '10%' },
          { range: '₹10,00,001 - ₹12,00,000', rate: '15%' },
          { range: '₹12,00,001 - ₹15,00,000', rate: '20%' },
          { range: 'Above ₹15,00,000', rate: '30%' }
        ],
        standardDeduction: 75000,
        rebate87A: 'Up to ₹25,000 for income ≤ ₹7,00,000'
      }
    }
  });
});

// GET /api/tax/deductions - Get available deductions info
router.get('/deductions', (req, res) => {
  res.json({
    success: true,
    data: [
      { section: '80C', limit: 150000, description: 'PPF, ELSS, LIC, EPF, NSC, Tax-saving FD, Home Loan Principal', regime: 'old' },
      { section: '80CCD(1B)', limit: 50000, description: 'Additional NPS contribution (over 80C limit)', regime: 'old' },
      { section: '80D', limit: 25000, description: 'Health Insurance Premium (₹50,000 for senior citizens)', regime: 'old' },
      { section: '80E', limit: null, description: 'Interest on Education Loan (no upper limit)', regime: 'old' },
      { section: '80G', limit: null, description: 'Donations to charitable organizations (50% or 100%)', regime: 'old' },
      { section: '80TTA', limit: 10000, description: 'Interest on Savings Account (₹50,000 for seniors under 80TTB)', regime: 'old' },
      { section: '24(b)', limit: 200000, description: 'Home Loan Interest (self-occupied property)', regime: 'both' },
      { section: 'HRA', limit: null, description: 'House Rent Allowance exemption', regime: 'old' },
      { section: 'LTA', limit: null, description: 'Leave Travel Allowance (2 journeys in 4-year block)', regime: 'old' },
      { section: 'Standard Deduction', limit: 50000, description: '₹50,000 (Old) / ₹75,000 (New) flat deduction', regime: 'both' }
    ]
  });
});

module.exports = router;

// Made with Bob
