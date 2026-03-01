import React from 'react';
import { formatCurrency, calcPercentage } from '../utils/formatters';

const DeductionRow = ({ label, current, max, section, description, regime }) => {
  const pct = max ? calcPercentage(current, max) : 0;
  const remaining = max ? Math.max(0, max - current) : 0;

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-800 text-sm">{label}</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{section}</span>
            {regime === 'old' && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Old Regime Only</span>
            )}
            {regime === 'both' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Both Regimes</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
        <div className="text-right ml-4">
          <p className="font-bold text-gray-800">{formatCurrency(current)}</p>
          {max && <p className="text-xs text-gray-400">of {formatCurrency(max)}</p>}
        </div>
      </div>
      {max > 0 && (
        <div>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full transition-all ${
                pct >= 90 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : pct > 0 ? 'bg-blue-400' : 'bg-gray-300'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{pct}% utilized</span>
            {remaining > 0 && <span className="text-orange-500">₹{(remaining / 1000).toFixed(0)}K remaining</span>}
            {remaining === 0 && <span className="text-green-600">✓ Fully utilized</span>}
          </div>
        </div>
      )}
    </div>
  );
};

const DeductionsAnalyzer = ({ taxData }) => {
  const { salaryDetails, deductions } = taxData;

  const deductionItems = [
    {
      label: 'Standard Deduction',
      current: deductions.standardDeduction || 50000,
      max: 50000,
      section: 'Sec 16(ia)',
      description: 'Flat deduction available to all salaried employees',
      regime: 'old'
    },
    {
      label: 'Professional Tax',
      current: deductions.professionalTax || 0,
      max: 2500,
      section: 'Sec 16(iii)',
      description: 'State-levied professional tax paid by employee',
      regime: 'old'
    },
    {
      label: 'HRA Exemption',
      current: deductions.hraExemption || 0,
      max: salaryDetails.hra || 0,
      section: 'Sec 10(13A)',
      description: 'House Rent Allowance exemption for rent paid',
      regime: 'old'
    },
    {
      label: 'Section 80C Investments',
      current: deductions.section80C || 0,
      max: 150000,
      section: '80C',
      description: 'PPF, ELSS, LIC, EPF, NSC, Tax-saving FD, Home Loan Principal',
      regime: 'old'
    },
    {
      label: 'NPS Contribution',
      current: deductions.nps || 0,
      max: 50000,
      section: '80CCD(1B)',
      description: 'Additional NPS contribution over and above 80C limit',
      regime: 'old'
    },
    {
      label: 'Health Insurance Premium',
      current: deductions.section80D || 0,
      max: 25000,
      section: '80D',
      description: 'Medical insurance for self, family, and parents',
      regime: 'old'
    },
    {
      label: 'Education Loan Interest',
      current: deductions.section80E || 0,
      max: null,
      section: '80E',
      description: 'Interest on education loan (no upper limit)',
      regime: 'old'
    },
    {
      label: 'Charitable Donations',
      current: deductions.section80G || 0,
      max: null,
      section: '80G',
      description: '50% or 100% deduction on donations to eligible organizations',
      regime: 'old'
    },
    {
      label: 'Savings Account Interest',
      current: deductions.section80TTA || 0,
      max: 10000,
      section: '80TTA',
      description: 'Interest earned on savings bank accounts',
      regime: 'old'
    },
    {
      label: 'Home Loan Interest',
      current: 0,
      max: 200000,
      section: '24(b)',
      description: 'Interest on home loan for self-occupied property',
      regime: 'both'
    }
  ];

  const totalDeductions = deductionItems.reduce((sum, d) => sum + (d.current || 0), 0);
  const totalPossible = deductionItems.reduce((sum, d) => sum + (d.max || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Deductions Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500">Total Claimed</p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(totalDeductions)}</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-500">Max Possible</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(totalPossible)}</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-gray-500">Unclaimed</p>
            <p className="text-xl font-bold text-orange-700">{formatCurrency(Math.max(0, totalPossible - totalDeductions))}</p>
          </div>
        </div>
      </div>

      {/* Salary Components */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Salary Components</h3>
        <div className="space-y-3">
          {[
            { label: 'Basic Salary', value: salaryDetails.basicSalary },
            { label: 'HRA', value: salaryDetails.hra },
            { label: 'Special Allowance', value: salaryDetails.specialAllowance },
            { label: 'LTA', value: salaryDetails.lta },
            { label: 'Medical Allowance', value: salaryDetails.medicalAllowance },
            { label: 'Other Allowances', value: salaryDetails.otherAllowances },
            { label: 'Perquisites', value: salaryDetails.perquisites },
          ].filter(item => item.value > 0).map((item, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className="font-semibold text-gray-800">{formatCurrency(item.value)}</span>
            </div>
          ))}
          <div className="flex justify-between items-center py-2 bg-blue-50 px-3 rounded-lg">
            <span className="text-sm font-bold text-blue-800">Gross Salary</span>
            <span className="font-bold text-blue-800">{formatCurrency(salaryDetails.grossSalary)}</span>
          </div>
        </div>
      </div>

      {/* Deductions List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Deductions & Exemptions</h3>
        <div className="space-y-3">
          {deductionItems.map((item, i) => (
            <DeductionRow key={i} {...item} />
          ))}
        </div>
      </div>

      {/* Tax Saving Tips */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
        <h4 className="font-semibold text-indigo-800 mb-3">💡 Quick Tax Saving Tips</h4>
        <ul className="space-y-2 text-sm text-indigo-700">
          <li>• Maximize 80C (₹1.5L) + NPS 80CCD(1B) (₹50K) = ₹2L total deduction</li>
          <li>• Health insurance for family + parents can save up to ₹75,000 under 80D</li>
          <li>• Home loan interest deduction up to ₹2L under Section 24(b)</li>
          <li>• Claim HRA exemption with proper rent receipts and agreement</li>
          <li>• Donate to PM Relief Fund for 100% deduction under 80G</li>
        </ul>
      </div>
    </div>
  );
};

export default DeductionsAnalyzer;

// Made with Bob
