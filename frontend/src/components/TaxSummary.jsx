import React from 'react';
import { TrendingDown, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { formatCurrency, toIndianWords } from '../utils/formatters';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';

const StatCard = ({ title, value, subtitle, icon: Icon, color, highlight }) => (
  <div className={`bg-white rounded-xl p-5 shadow-sm border ${highlight ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-100'}`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={`text-2xl font-bold mt-1 ${color || 'text-gray-800'}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {Icon && (
        <div className={`p-2 rounded-lg ${highlight ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <Icon className={`w-5 h-5 ${highlight ? 'text-blue-600' : 'text-gray-500'}`} />
        </div>
      )}
    </div>
  </div>
);

const RegimeCompare = ({ oldRegime, newRegime, recommended }) => {
  const data = [
    { name: 'Old Regime', tax: oldRegime.totalTax, fill: recommended === 'old' ? '#3b82f6' : '#e5e7eb' },
    { name: 'New Regime', tax: newRegime.totalTax, fill: recommended === 'new' ? '#3b82f6' : '#e5e7eb' },
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tax Regime Comparison</h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-xl border-2 ${recommended === 'old' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700">Old Regime</span>
            {recommended === 'old' && (
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">✓ Recommended</span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(oldRegime.totalTax)}</p>
          <p className="text-xs text-gray-500 mt-1">Taxable: {formatCurrency(oldRegime.taxableIncome)}</p>
          <p className="text-xs text-gray-500">Deductions: {formatCurrency(oldRegime.totalDeductions)}</p>
        </div>
        <div className={`p-4 rounded-xl border-2 ${recommended === 'new' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700">New Regime</span>
            {recommended === 'new' && (
              <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">✓ Recommended</span>
            )}
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatCurrency(newRegime.totalTax)}</p>
          <p className="text-xs text-gray-500 mt-1">Taxable: {formatCurrency(newRegime.taxableIncome)}</p>
          <p className="text-xs text-gray-500">Std. Deduction: ₹75,000</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} barSize={60}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `₹${toIndianWords(v)}`} tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Bar dataKey="tax" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const TaxBreakdown = ({ regime, label }) => {
  const pieData = [
    { name: 'Base Tax', value: regime.baseTax || 0, fill: '#3b82f6' },
    { name: 'Surcharge', value: regime.surcharge || 0, fill: '#8b5cf6' },
    { name: 'Cess (4%)', value: regime.cess || 0, fill: '#06b6d4' },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Tax Breakdown ({label})</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Gross Salary</span>
          <span className="font-semibold text-gray-800">{formatCurrency(regime.grossSalary)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Total Deductions</span>
          <span className="font-semibold text-green-600">- {formatCurrency(regime.totalDeductions)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100 bg-gray-50 px-2 rounded">
          <span className="text-sm font-semibold text-gray-700">Taxable Income</span>
          <span className="font-bold text-gray-800">{formatCurrency(regime.taxableIncome)}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Income Tax</span>
          <span className="font-semibold text-gray-800">{formatCurrency(regime.baseTax)}</span>
        </div>
        {regime.rebate87A > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Rebate u/s 87A</span>
            <span className="font-semibold text-green-600">- {formatCurrency(regime.rebate87A)}</span>
          </div>
        )}
        {regime.surcharge > 0 && (
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Surcharge</span>
            <span className="font-semibold text-gray-800">{formatCurrency(regime.surcharge)}</span>
          </div>
        )}
        <div className="flex justify-between items-center py-2 border-b border-gray-100">
          <span className="text-sm text-gray-600">Health & Education Cess (4%)</span>
          <span className="font-semibold text-gray-800">{formatCurrency(regime.cess)}</span>
        </div>
        <div className="flex justify-between items-center py-2 bg-blue-50 px-2 rounded">
          <span className="text-sm font-bold text-blue-800">Total Tax Payable</span>
          <span className="font-bold text-blue-800 text-lg">{formatCurrency(regime.totalTax)}</span>
        </div>
      </div>
      {pieData.length > 0 && (
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value">
                {pieData.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

const TaxSummary = ({ data }) => {
  const { taxData, comparisonResult, summary } = data;
  const { oldRegime, newRegime, recommended, savings } = comparisonResult;

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <div className={`flex items-start space-x-3 p-4 rounded-xl ${summary.refundDue > 0 ? 'bg-green-50 border border-green-200' : summary.taxDue > 0 ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
        {summary.refundDue > 0 ? (
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : summary.taxDue > 0 ? (
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        )}
        <div>
          {summary.refundDue > 0 && (
            <p className="font-semibold text-green-800">
              🎉 You are eligible for a refund of {formatCurrency(summary.refundDue)}!
            </p>
          )}
          {summary.taxDue > 0 && (
            <p className="font-semibold text-red-800">
              ⚠️ Additional tax due: {formatCurrency(summary.taxDue)}. Pay advance tax to avoid penalty.
            </p>
          )}
          {summary.refundDue === 0 && summary.taxDue === 0 && (
            <p className="font-semibold text-blue-800">✅ Your TDS is perfectly matched with tax liability.</p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Recommended: <strong>{recommended === 'old' ? 'Old Tax Regime' : 'New Tax Regime'}</strong> — saves you {formatCurrency(savings)}
          </p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Gross Income"
          value={formatCurrency(summary.grossIncome)}
          subtitle={toIndianWords(summary.grossIncome)}
          icon={DollarSign}
        />
        <StatCard
          title="Tax Payable"
          value={formatCurrency(summary.recommendedTax)}
          subtitle={`${summary.effectiveTaxRate}% effective rate`}
          icon={TrendingUp}
          color="text-red-600"
        />
        <StatCard
          title="TDS Paid"
          value={formatCurrency(summary.tdsPaid)}
          subtitle="By employer"
          icon={CheckCircle}
          color="text-green-600"
        />
        <StatCard
          title={summary.refundDue > 0 ? 'Refund Due' : 'Tax Due'}
          value={formatCurrency(summary.refundDue > 0 ? summary.refundDue : summary.taxDue)}
          subtitle={summary.refundDue > 0 ? 'File ITR to claim' : 'Pay advance tax'}
          icon={summary.refundDue > 0 ? TrendingDown : AlertTriangle}
          color={summary.refundDue > 0 ? 'text-green-600' : 'text-red-600'}
          highlight={true}
        />
      </div>

      {/* Regime Comparison */}
      <RegimeCompare oldRegime={oldRegime} newRegime={newRegime} recommended={recommended} />

      {/* Tax Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TaxBreakdown regime={oldRegime} label="Old Regime" />
        <TaxBreakdown regime={newRegime} label="New Regime" />
      </div>

      {/* Employee Info */}
      {(taxData.employeeInfo?.name || taxData.employeeInfo?.pan) && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Employee Information</h3>
          <div className="grid grid-cols-2 gap-4">
            {taxData.employeeInfo.name && (
              <div>
                <p className="text-xs text-gray-500">Employee Name</p>
                <p className="font-semibold text-gray-800">{taxData.employeeInfo.name}</p>
              </div>
            )}
            {taxData.employeeInfo.pan && (
              <div>
                <p className="text-xs text-gray-500">PAN</p>
                <p className="font-semibold text-gray-800">{taxData.employeeInfo.pan}</p>
              </div>
            )}
            {taxData.employerInfo?.name && (
              <div>
                <p className="text-xs text-gray-500">Employer</p>
                <p className="font-semibold text-gray-800">{taxData.employerInfo.name}</p>
              </div>
            )}
            {taxData.employerInfo?.tan && (
              <div>
                <p className="text-xs text-gray-500">TAN</p>
                <p className="font-semibold text-gray-800">{taxData.employerInfo.tan}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaxSummary;

// Made with Bob
