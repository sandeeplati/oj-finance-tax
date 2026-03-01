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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// POST /api/tax/upload - Upload and parse Form 16
router.post('/upload', upload.single('form16'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const age = parseInt(req.body.age) || 30;
    const taxData = await parseForm16(req.file.buffer);
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
