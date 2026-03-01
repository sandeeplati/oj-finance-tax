import React, { useState } from 'react';

// Tax slab data for multiple financial years
const TAX_DATA = {
  '2025-26': {
    financialYear: '2025-26',
    assessmentYear: '2026-27',
    status: 'current',
    oldRegime: {
      slabs: [
        { range: 'Up to ₹2,50,000', rate: '0%' },
        { range: '₹2,50,001 - ₹5,00,000', rate: '5%' },
        { range: '₹5,00,001 - ₹10,00,000', rate: '20%' },
        { range: 'Above ₹10,00,000', rate: '30%' },
      ],
      standardDeduction: 50000,
      rebate87A: 'Up to ₹12,500 for income ≤ ₹5,00,000',
      keyChanges: ['No major changes from FY 2024-25 in old regime']
    },
    newRegime: {
      slabs: [
        { range: 'Up to ₹4,00,000', rate: '0%' },
        { range: '₹4,00,001 - ₹8,00,000', rate: '5%' },
        { range: '₹8,00,001 - ₹12,00,000', rate: '10%' },
        { range: '₹12,00,001 - ₹16,00,000', rate: '15%' },
        { range: '₹16,00,001 - ₹20,00,000', rate: '20%' },
        { range: '₹20,00,001 - ₹24,00,000', rate: '25%' },
        { range: 'Above ₹24,00,000', rate: '30%' },
      ],
      standardDeduction: 75000,
      rebate87A: 'Up to ₹60,000 for income ≤ ₹12,00,000',
      keyChanges: [
        'Nil tax up to ₹12L income (with rebate)',
        'New zero-tax slab up to ₹4L (was ₹3L)',
        'Rebate u/s 87A increased to ₹60,000',
        'New 25% slab added for ₹20L-₹24L range'
      ]
    }
  },
  '2024-25': {
    financialYear: '2024-25',
    assessmentYear: '2025-26',
    status: 'filing',
    oldRegime: {
      slabs: [
        { range: 'Up to ₹2,50,000', rate: '0%' },
        { range: '₹2,50,001 - ₹5,00,000', rate: '5%' },
        { range: '₹5,00,001 - ₹10,00,000', rate: '20%' },
        { range: 'Above ₹10,00,000', rate: '30%' },
      ],
      standardDeduction: 50000,
      rebate87A: 'Up to ₹12,500 for income ≤ ₹5,00,000',
      keyChanges: ['Standard deduction remains ₹50,000 in old regime']
    },
    newRegime: {
      slabs: [
        { range: 'Up to ₹3,00,000', rate: '0%' },
        { range: '₹3,00,001 - ₹7,00,000', rate: '5%' },
        { range: '₹7,00,001 - ₹10,00,000', rate: '10%' },
        { range: '₹10,00,001 - ₹12,00,000', rate: '15%' },
        { range: '₹12,00,001 - ₹15,00,000', rate: '20%' },
        { range: 'Above ₹15,00,000', rate: '30%' },
      ],
      standardDeduction: 75000,
      rebate87A: 'Up to ₹25,000 for income ≤ ₹7,00,000',
      keyChanges: [
        'Standard deduction increased to ₹75,000 (from ₹50,000)',
        'New regime is default from FY 2023-24',
        'Rebate u/s 87A: ₹25,000 for income ≤ ₹7L'
      ]
    }
  },
  '2023-24': {
    financialYear: '2023-24',
    assessmentYear: '2024-25',
    status: 'past',
    oldRegime: {
      slabs: [
        { range: 'Up to ₹2,50,000', rate: '0%' },
        { range: '₹2,50,001 - ₹5,00,000', rate: '5%' },
        { range: '₹5,00,001 - ₹10,00,000', rate: '20%' },
        { range: 'Above ₹10,00,000', rate: '30%' },
      ],
      standardDeduction: 50000,
      rebate87A: 'Up to ₹12,500 for income ≤ ₹5,00,000',
      keyChanges: ['Same slabs as previous years']
    },
    newRegime: {
      slabs: [
        { range: 'Up to ₹3,00,000', rate: '0%' },
        { range: '₹3,00,001 - ₹6,00,000', rate: '5%' },
        { range: '₹6,00,001 - ₹9,00,000', rate: '10%' },
        { range: '₹9,00,001 - ₹12,00,000', rate: '15%' },
        { range: '₹12,00,001 - ₹15,00,000', rate: '20%' },
        { range: 'Above ₹15,00,000', rate: '30%' },
      ],
      standardDeduction: 50000,
      rebate87A: 'Up to ₹25,000 for income ≤ ₹7,00,000',
      keyChanges: [
        'New regime made default',
        'Standard deduction of ₹50,000 introduced in new regime',
        'Rebate u/s 87A extended to ₹7L income'
      ]
    }
  },
  '2022-23': {
    financialYear: '2022-23',
    assessmentYear: '2023-24',
    status: 'past',
    oldRegime: {
      slabs: [
        { range: 'Up to ₹2,50,000', rate: '0%' },
        { range: '₹2,50,001 - ₹5,00,000', rate: '5%' },
        { range: '₹5,00,001 - ₹10,00,000', rate: '20%' },
        { range: 'Above ₹10,00,000', rate: '30%' },
      ],
      standardDeduction: 50000,
      rebate87A: 'Up to ₹12,500 for income ≤ ₹5,00,000',
      keyChanges: ['Standard deduction ₹50,000 for salaried']
    },
    newRegime: {
      slabs: [
        { range: 'Up to ₹2,50,000', rate: '0%' },
        { range: '₹2,50,001 - ₹5,00,000', rate: '5%' },
        { range: '₹5,00,001 - ₹7,50,000', rate: '10%' },
        { range: '₹7,50,001 - ₹10,00,000', rate: '15%' },
        { range: '₹10,00,001 - ₹12,50,000', rate: '20%' },
        { range: '₹12,50,001 - ₹15,00,000', rate: '25%' },
        { range: 'Above ₹15,00,000', rate: '30%' },
      ],
      standardDeduction: 0,
      rebate87A: 'Up to ₹12,500 for income ≤ ₹5,00,000',
      keyChanges: [
        'No standard deduction in new regime',
        'More granular slabs (7 slabs)',
        'New regime optional (not default)'
      ]
    }
  }
};

const FY_ORDER = ['2025-26', '2024-25', '2023-24', '2022-23'];

const SlabTable = ({ slabs, title, standardDeduction, rebate, keyChanges, color }) => (
  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
    <div className={`px-5 py-3 ${color || 'bg-gradient-to-r from-blue-600 to-indigo-600'}`}>
      <h4 className="font-semibold text-white">{title}</h4>
    </div>
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50">
          <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Income Range</th>
          <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tax Rate</th>
        </tr>
      </thead>
      <tbody>
        {slabs.map((slab, i) => (
          <tr key={i} className={`border-t border-gray-50 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
            <td className="px-4 py-3 text-sm text-gray-700">{slab.range}</td>
            <td className="px-4 py-3 text-sm font-semibold text-right">
              <span className={`px-2 py-1 rounded-full text-xs ${
                slab.rate === '0%' ? 'bg-green-100 text-green-700' :
                slab.rate === '5%' ? 'bg-yellow-100 text-yellow-700' :
                slab.rate === '10%' || slab.rate === '15%' ? 'bg-orange-100 text-orange-700' :
                slab.rate === '20%' || slab.rate === '25%' ? 'bg-red-100 text-red-700' :
                'bg-red-200 text-red-800'
              }`}>
                {slab.rate}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 space-y-1">
      <p className="text-xs text-blue-700">
        <strong>Standard Deduction:</strong> {standardDeduction > 0 ? `₹${(standardDeduction / 1000).toFixed(0)},000` : 'Not applicable'}
      </p>
      <p className="text-xs text-blue-700">
        <strong>Rebate u/s 87A:</strong> {rebate}
      </p>
    </div>
    {keyChanges && keyChanges.length > 0 && (
      <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-100">
        <p className="text-xs font-semibold text-yellow-800 mb-1">Key Changes:</p>
        <ul className="space-y-0.5">
          {keyChanges.map((change, i) => (
            <li key={i} className="text-xs text-yellow-700">• {change}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const TaxSlabs = () => {
  const [selectedFY, setSelectedFY] = useState('2024-25');
  const data = TAX_DATA[selectedFY];

  const statusBadge = (fy) => {
    const s = TAX_DATA[fy].status;
    if (s === 'current') return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-1">Current</span>;
    if (s === 'filing') return <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-1">Filing Now</span>;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Income Tax Slabs</h3>
            <p className="text-sm text-gray-500">Assessment Year {data.assessmentYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Select Financial Year:</span>
          </div>
        </div>

        {/* FY Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          {FY_ORDER.map(fy => (
            <button
              key={fy}
              onClick={() => setSelectedFY(fy)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                selectedFY === fy
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
              }`}
            >
              FY {fy}
              {statusBadge(fy)}
            </button>
          ))}
        </div>
      </div>

      {/* Slab Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SlabTable
          slabs={data.oldRegime.slabs}
          title="Old Tax Regime"
          standardDeduction={data.oldRegime.standardDeduction}
          rebate={data.oldRegime.rebate87A}
          keyChanges={data.oldRegime.keyChanges}
          color="bg-gradient-to-r from-orange-500 to-red-500"
        />
        <SlabTable
          slabs={data.newRegime.slabs}
          title={`New Tax Regime ${data.status === 'current' || data.status === 'filing' ? '(Default)' : ''}`}
          standardDeduction={data.newRegime.standardDeduction}
          rebate={data.newRegime.rebate87A}
          keyChanges={data.newRegime.keyChanges}
          color="bg-gradient-to-r from-blue-600 to-indigo-600"
        />
      </div>

      {/* Common Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
          <h4 className="font-semibold text-orange-800 mb-2">📌 Surcharge Rates (All Years)</h4>
          <ul className="text-xs text-orange-700 space-y-1">
            <li>• Income ₹50L - ₹1Cr: 10% surcharge</li>
            <li>• Income ₹1Cr - ₹2Cr: 15% surcharge</li>
            <li>• Income ₹2Cr - ₹5Cr: 25% surcharge</li>
            <li>• Income above ₹5Cr: 37% (old) / 25% (new)</li>
          </ul>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <h4 className="font-semibold text-purple-800 mb-2">📌 Health & Education Cess</h4>
          <ul className="text-xs text-purple-700 space-y-1">
            <li>• 4% on (Income Tax + Surcharge)</li>
            <li>• Applicable under both regimes</li>
            <li>• Cannot be claimed as deduction</li>
            <li>• Applicable from FY 2018-19 onwards</li>
          </ul>
        </div>
      </div>

      {/* Old vs New Comparison */}
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <h4 className="font-semibold text-yellow-800 mb-3">⚖️ Old vs New Regime — Key Differences (FY {selectedFY})</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-600">
                <th className="text-left py-1 pr-4">Feature</th>
                <th className="text-center py-1 px-2">Old Regime</th>
                <th className="text-center py-1 px-2">New Regime</th>
              </tr>
            </thead>
            <tbody className="text-gray-700">
              {[
                ['Standard Deduction', `₹${(data.oldRegime.standardDeduction/1000).toFixed(0)}K`, `₹${(data.newRegime.standardDeduction/1000).toFixed(0)}K`],
                ['80C Deductions', '✅ Up to ₹1.5L', '❌ Not allowed'],
                ['80D Health Insurance', '✅ Allowed', '❌ Not allowed'],
                ['HRA Exemption', '✅ Allowed', '❌ Not allowed'],
                ['NPS 80CCD(1B)', '✅ ₹50,000', '❌ Not allowed'],
                ['Home Loan Interest', '✅ Up to ₹2L', '❌ Not allowed'],
                ['LTA Exemption', '✅ Allowed', '❌ Not allowed'],
                ['Rebate 87A', data.oldRegime.rebate87A.split(' for')[0], data.newRegime.rebate87A.split(' for')[0]],
              ].map(([feature, old, newR], i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white bg-opacity-50' : ''}>
                  <td className="py-1.5 pr-4 font-medium">{feature}</td>
                  <td className="py-1.5 px-2 text-center">{old}</td>
                  <td className="py-1.5 px-2 text-center">{newR}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaxSlabs;

// Made with Bob
