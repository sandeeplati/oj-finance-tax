import React, { useState } from 'react';
import { calculateTax } from '../services/taxApi';

// ─── Indian salary structure defaults ────────────────────────────────────────
// Basic: 40% | HRA: 50% of basic (metro) | LTA: ~1 month basic/yr
// Medical: 2% | Other: 3% | Special Allowance: fills the remainder
const calcSalaryBreakdown = (gross) => {
  const g = parseFloat(gross) || 0;
  if (!g) return { basicSalary: '', hra: '', specialAllowance: '', lta: '', medicalAllowance: '', otherAllowances: '', perquisites: '' };

  const basic = Math.round(g * 0.40);
  const hra = Math.round(basic * 0.50);
  const lta = Math.round(basic * 0.0833);
  const medicalAllowance = Math.round(g * 0.02);
  const otherAllowances = Math.round(g * 0.03);
  const specialAllowance = Math.max(0, g - basic - hra - lta - medicalAllowance - otherAllowances);

  return {
    basicSalary: String(basic),
    hra: String(hra),
    specialAllowance: String(specialAllowance),
    lta: String(lta),
    medicalAllowance: String(medicalAllowance),
    otherAllowances: String(otherAllowances),
    perquisites: '0',
  };
};

// Default deductions: PF (12% of basic) + ELSS suggestion capped at ₹1.5L, HRA exemption ~80% of HRA
const calcDefaultDeductions = (basic, hra) => {
  const pf = Math.min(Math.round(parseFloat(basic) * 0.12), 150000);
  const section80C = Math.min(pf + 50000, 150000);
  const hraExemption = Math.round(parseFloat(hra) * 0.80);
  return {
    section80C: String(section80C),
    hraExemption: String(hraExemption),
    professionalTax: '2400',
  };
};

// ─── Reusable input field ─────────────────────────────────────────────────────
const InputField = ({ label, name, value, onChange, hint, autoFilled }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      <span className="flex items-center gap-1.5">
        {label}
        {autoFilled && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-normal leading-none">auto</span>
        )}
      </span>
    </label>
    <input
      type="number"
      name={name}
      value={value}
      onChange={onChange}
      placeholder="0"
      min="0"
      className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-colors ${
        autoFilled && value ? 'border-amber-300 bg-amber-50 focus:bg-white' : 'border-gray-300 bg-white'
      }`}
    />
    {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const ManualEntry = ({ onResult, isLoading, setIsLoading }) => {
  const [age, setAge] = useState(30);
  const [autoFilledFields, setAutoFilledFields] = useState(new Set());
  const [salary, setSalary] = useState({
    grossSalary: '', basicSalary: '', hra: '', specialAllowance: '',
    lta: '', medicalAllowance: '', otherAllowances: '', perquisites: ''
  });
  const [deductions, setDeductions] = useState({
    section80C: '', section80D: '', section80G: '', section80E: '',
    section80TTA: '', nps: '', standardDeduction: '50000',
    professionalTax: '', hraExemption: ''
  });
  const [taxDetails, setTaxDetails] = useState({ tdsPaid: '' });
  const [activeSection, setActiveSection] = useState('salary');

  // ── Gross salary change → auto-fill all components ──
  const handleGrossSalaryChange = (e) => {
    const gross = e.target.value;
    const breakdown = calcSalaryBreakdown(gross);
    setSalary({ grossSalary: gross, ...breakdown });

    if (gross) {
      const defaultDed = calcDefaultDeductions(breakdown.basicSalary, breakdown.hra);
      setDeductions(prev => ({ ...prev, ...defaultDed }));
      setAutoFilledFields(new Set([
        'basicSalary', 'hra', 'specialAllowance', 'lta', 'medicalAllowance', 'otherAllowances', 'perquisites',
        'section80C', 'hraExemption', 'professionalTax'
      ]));
    } else {
      setAutoFilledFields(new Set());
    }
  };

  // ── Manual edits remove the "auto" badge ──
  const handleSalaryChange = (e) => {
    const { name } = e.target;
    setSalary(prev => ({ ...prev, [name]: e.target.value }));
    setAutoFilledFields(prev => { const s = new Set(prev); s.delete(name); return s; });
  };

  const handleDeductionChange = (e) => {
    const { name } = e.target;
    setDeductions(prev => ({ ...prev, [name]: e.target.value }));
    setAutoFilledFields(prev => { const s = new Set(prev); s.delete(name); return s; });
  };

  const toNum = (v) => parseFloat(v) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const taxData = {
        employeeInfo: { name: 'Manual Entry', pan: '' },
        employerInfo: { name: '', tan: '' },
        salaryDetails: {
          grossSalary: toNum(salary.grossSalary),
          basicSalary: toNum(salary.basicSalary),
          hra: toNum(salary.hra),
          specialAllowance: toNum(salary.specialAllowance),
          lta: toNum(salary.lta),
          medicalAllowance: toNum(salary.medicalAllowance),
          otherAllowances: toNum(salary.otherAllowances),
          perquisites: toNum(salary.perquisites),
        },
        deductions: {
          section80C: toNum(deductions.section80C),
          section80D: toNum(deductions.section80D),
          section80G: toNum(deductions.section80G),
          section80E: toNum(deductions.section80E),
          section80TTA: toNum(deductions.section80TTA),
          nps: toNum(deductions.nps),
          standardDeduction: toNum(deductions.standardDeduction),
          professionalTax: toNum(deductions.professionalTax),
          hraExemption: toNum(deductions.hraExemption),
        },
        taxDetails: {
          tdsPaid: toNum(taxDetails.tdsPaid),
          assessmentYear: '2025-26'
        }
      };
      const result = await calculateTax(taxData, age);
      onResult(result.data);
    } catch (err) {
      alert('Error calculating tax: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'salary', label: '💼 Salary' },
    { id: 'deductions', label: '📉 Deductions' },
    { id: 'tax', label: '🧾 Tax Paid' },
  ];

  const af = (field) => autoFilledFields.has(field);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-1">Manual Tax Entry</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your income and deduction details manually</p>

        {/* Age */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Your Age</label>
          <input
            type="number" value={age} onChange={(e) => setAge(parseInt(e.target.value) || 30)}
            min="18" max="100"
            className="w-32 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* Section Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeSection === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>

          {/* ── Salary Section ── */}
          {activeSection === 'salary' && (
            <div className="space-y-4">
              {/* Gross Salary — primary trigger */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gross Salary (Annual) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="grossSalary"
                  value={salary.grossSalary}
                  onChange={handleGrossSalaryChange}
                  placeholder="e.g. 1200000"
                  min="0"
                  className="w-full px-3 py-2.5 border-2 border-blue-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-blue-50 focus:bg-white transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Enter gross salary — all components below will auto-fill using standard Indian salary structure
                </p>
              </div>

              {/* Auto-fill notice */}
              {salary.grossSalary && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-start gap-2 text-sm text-amber-800">
                  <span className="mt-0.5">✨</span>
                  <span>
                    Fields marked <span className="inline-flex items-center bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs font-medium">auto</span> are calculated using standard Indian salary structure (Basic 40%, HRA 50% of basic, etc.). Edit any field as needed.
                  </span>
                </div>
              )}

              {/* Salary breakdown grid */}
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Basic Salary" name="basicSalary" value={salary.basicSalary}
                  onChange={handleSalaryChange} hint="~40% of gross salary"
                  autoFilled={af('basicSalary')} />
                <InputField label="HRA" name="hra" value={salary.hra}
                  onChange={handleSalaryChange} hint="House Rent Allowance (~50% of basic)"
                  autoFilled={af('hra')} />
                <InputField label="Special Allowance" name="specialAllowance" value={salary.specialAllowance}
                  onChange={handleSalaryChange} hint="Balancing component"
                  autoFilled={af('specialAllowance')} />
                <InputField label="LTA" name="lta" value={salary.lta}
                  onChange={handleSalaryChange} hint="Leave Travel Allowance"
                  autoFilled={af('lta')} />
                <InputField label="Medical Allowance" name="medicalAllowance" value={salary.medicalAllowance}
                  onChange={handleSalaryChange} hint="~2% of gross"
                  autoFilled={af('medicalAllowance')} />
                <InputField label="Other Allowances" name="otherAllowances" value={salary.otherAllowances}
                  onChange={handleSalaryChange} hint="~3% of gross"
                  autoFilled={af('otherAllowances')} />
                <InputField label="Perquisites" name="perquisites" value={salary.perquisites}
                  onChange={handleSalaryChange} hint="Non-cash benefits (car, accommodation, etc.)"
                  autoFilled={af('perquisites')} />
              </div>
            </div>
          )}

          {/* ── Deductions Section ── */}
          {activeSection === 'deductions' && (
            <div className="space-y-4">
              {salary.grossSalary && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-start gap-2 text-sm text-amber-800">
                  <span className="mt-0.5">✨</span>
                  <span>
                    Fields marked <span className="inline-flex items-center bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-xs font-medium">auto</span> are estimated defaults based on your salary. Edit as needed.
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Section 80C" name="section80C" value={deductions.section80C}
                  onChange={handleDeductionChange} hint="Max ₹1,50,000 (PPF, ELSS, LIC, PF...)"
                  autoFilled={af('section80C')} />
                <InputField label="Section 80D" name="section80D" value={deductions.section80D}
                  onChange={handleDeductionChange} hint="Health insurance premium (max ₹25,000)" />
                <InputField label="NPS (80CCD 1B)" name="nps" value={deductions.nps}
                  onChange={handleDeductionChange} hint="Additional NPS contribution (max ₹50,000)" />
                <InputField label="HRA Exemption" name="hraExemption" value={deductions.hraExemption}
                  onChange={handleDeductionChange} hint="Exempt portion of HRA received"
                  autoFilled={af('hraExemption')} />
                <InputField label="Professional Tax" name="professionalTax" value={deductions.professionalTax}
                  onChange={handleDeductionChange} hint="Max ₹2,500/year"
                  autoFilled={af('professionalTax')} />
                <InputField label="Section 80G" name="section80G" value={deductions.section80G}
                  onChange={handleDeductionChange} hint="Charitable donations" />
                <InputField label="Section 80E" name="section80E" value={deductions.section80E}
                  onChange={handleDeductionChange} hint="Education loan interest" />
                <InputField label="Section 80TTA" name="section80TTA" value={deductions.section80TTA}
                  onChange={handleDeductionChange} hint="Savings account interest (max ₹10,000)" />
              </div>
            </div>
          )}

          {/* ── Tax Paid Section ── */}
          {activeSection === 'tax' && (
            <div className="space-y-4">
              <InputField label="TDS Paid (by employer)" name="tdsPaid" value={taxDetails.tdsPaid}
                onChange={(e) => setTaxDetails({ ...taxDetails, tdsPaid: e.target.value })}
                hint="Total TDS deducted from salary as per Form 16" />
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Where to find TDS?</strong> Check Part A of your Form 16 or Form 26AS on the income tax portal.
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation & Submit ── */}
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
            {activeSection !== 'salary' ? (
              <button type="button"
                onClick={() => setActiveSection(activeSection === 'tax' ? 'deductions' : 'salary')}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Back
              </button>
            ) : <div />}

            {activeSection !== 'tax' ? (
              <button type="button"
                onClick={() => setActiveSection(activeSection === 'salary' ? 'deductions' : 'tax')}
                className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next →
              </button>
            ) : (
              <button type="submit" disabled={isLoading || !salary.grossSalary}
                className={`px-6 py-2 text-sm font-semibold text-white rounded-lg transition ${
                  isLoading || !salary.grossSalary ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isLoading ? 'Calculating...' : '🧮 Calculate Tax'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualEntry;

// Made with Bob
