import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingDown, CheckCircle, Calendar, ArrowRight, Zap } from 'lucide-react';
import { formatCurrency, getPriorityColor, calcPercentage } from '../utils/formatters';

const ProgressBar = ({ current, max, label }) => {
  const pct = calcPercentage(current, max);
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}: {formatCurrency(current)} / {formatCurrency(max)}</span>
        <span>{pct}% utilized</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${pct >= 90 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Current FY Recommendation Card ──────────────────────────────────────────
const RecommendationCard = ({ rec, index }) => {
  const [expanded, setExpanded] = useState(index < 3);
  const colors = getPriorityColor(rec.priority);

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden transition-all duration-200`}>
      <button
        className="w-full text-left p-5 flex items-start justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-2xl flex-shrink-0">{rec.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                {rec.priority}
              </span>
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                {rec.category}
              </span>
            </div>
            <h3 className="font-semibold text-gray-800 text-sm md:text-base">{rec.title}</h3>
            {rec.potentialSaving > 0 && (
              <div className="flex items-center space-x-1 mt-1">
                <TrendingDown className="w-3 h-3 text-green-600" />
                <span className="text-xs font-semibold text-green-700">
                  Save up to {formatCurrency(rec.potentialSaving)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="ml-2 flex-shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 bg-white bg-opacity-60">
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{rec.description}</p>

          {rec.maxLimit && rec.currentAmount !== undefined && (
            <ProgressBar current={rec.currentAmount} max={rec.maxLimit} label="Utilized" />
          )}

          {rec.actionItems && rec.actionItems.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Action Items</p>
              <ul className="space-y-2">
                {rec.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Next FY Recommendation Card ─────────────────────────────────────────────
const NextYearCard = ({ rec, index }) => {
  const [expanded, setExpanded] = useState(index < 2);

  const priorityStyles = {
    HIGH: { border: 'border-violet-200', bg: 'bg-violet-50', badge: 'bg-violet-100 text-violet-700' },
    MEDIUM: { border: 'border-indigo-200', bg: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-700' },
    LOW: { border: 'border-slate-200', bg: 'bg-slate-50', badge: 'bg-slate-100 text-slate-600' },
  };
  const style = priorityStyles[rec.priority] || priorityStyles.LOW;

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} overflow-hidden transition-all duration-200`}>
      <button
        className="w-full text-left p-5 flex items-start justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-2xl flex-shrink-0">{rec.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>
                {rec.priority}
              </span>
              <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                {rec.category}
              </span>
              {rec.timeline && (
                <span className="flex items-center space-x-1 text-xs text-violet-600 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                  <Calendar className="w-3 h-3" />
                  <span>{rec.timeline}</span>
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-800 text-sm md:text-base">{rec.title}</h3>
            {rec.impact > 0 && (
              <div className="flex items-center space-x-1 mt-1">
                <Zap className="w-3 h-3 text-violet-600" />
                <span className="text-xs font-semibold text-violet-700">
                  Potential impact: {formatCurrency(rec.impact)}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="ml-2 flex-shrink-0">
          {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-violet-100 bg-white bg-opacity-60">
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">{rec.description}</p>

          {rec.actionItems && rec.actionItems.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2">Steps to Take</p>
              <ul className="space-y-2">
                {rec.actionItems.map((item, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <ArrowRight className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Recommendations Component ──────────────────────────────────────────
const Recommendations = ({ recommendations, nextYearRecommendations }) => {
  const [filter, setFilter] = useState('ALL');
  const [activeSection, setActiveSection] = useState('current');

  const highCount = recommendations.filter(r => r.priority === 'HIGH').length;
  const mediumCount = recommendations.filter(r => r.priority === 'MEDIUM').length;
  const lowCount = recommendations.filter(r => r.priority === 'LOW').length;
  const totalSavings = recommendations.reduce((sum, r) => sum + (r.potentialSaving || 0), 0);

  const nextYearList = nextYearRecommendations || [];
  const nextHighCount = nextYearList.filter(r => r.priority === 'HIGH').length;
  const nextTotalImpact = nextYearList.reduce((sum, r) => sum + (r.impact || 0), 0);

  const filtered = filter === 'ALL' ? recommendations : recommendations.filter(r => r.priority === filter);

  return (
    <div className="space-y-6">
      {/* Section Toggle */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveSection('current')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all border
            ${activeSection === 'current'
              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}
        >
          📊 FY 2024-25 Recommendations
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${activeSection === 'current' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {recommendations.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSection('next')}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all border
            ${activeSection === 'next'
              ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
            }`}
        >
          🚀 FY 2025-26 Planning
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${activeSection === 'next' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {nextYearList.length}
          </span>
        </button>
      </div>

      {/* ── Current FY Section ── */}
      {activeSection === 'current' && (
        <>
          {/* Summary Bar */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold">FY 2024-25 Tax Saving Recommendations</h3>
                <p className="text-blue-100 text-sm mt-0.5">
                  {recommendations.length} recommendations based on your Form 16
                </p>
              </div>
              {totalSavings > 0 && (
                <div className="text-right">
                  <p className="text-blue-100 text-xs">Potential Total Savings</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSavings)}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 text-center">
                <p className="text-xs text-blue-100">High Priority</p>
                <p className="font-bold text-lg">{highCount}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 text-center">
                <p className="text-xs text-blue-100">Medium</p>
                <p className="font-bold text-lg">{mediumCount}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 text-center">
                <p className="text-xs text-blue-100">Low</p>
                <p className="font-bold text-lg">{lowCount}</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-1">
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${filter === f
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
                  }`}
              >
                {f === 'ALL' ? `All (${recommendations.length})` :
                 f === 'HIGH' ? `🔴 High (${highCount})` :
                 f === 'MEDIUM' ? `🟡 Medium (${mediumCount})` :
                 `🟢 Low (${lowCount})`}
              </button>
            ))}
          </div>

          {/* Recommendation Cards */}
          <div className="space-y-3">
            {filtered.map((rec, index) => (
              <RecommendationCard key={index} rec={rec} index={index} />
            ))}
          </div>
        </>
      )}

      {/* ── Next FY Section ── */}
      {activeSection === 'next' && (
        <>
          {/* Next Year Summary Banner */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold">FY 2025-26 Tax Planning Guide</h3>
                <p className="text-violet-100 text-sm mt-0.5">
                  Personalized recommendations based on your FY 2024-25 Form 16
                </p>
              </div>
              {nextTotalImpact > 0 && (
                <div className="text-right">
                  <p className="text-violet-100 text-xs">Estimated Annual Impact</p>
                  <p className="text-2xl font-bold">{formatCurrency(nextTotalImpact)}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 text-center">
                <p className="text-xs text-violet-100">High Priority</p>
                <p className="font-bold text-lg">{nextHighCount}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 text-center">
                <p className="text-xs text-violet-100">Action Items</p>
                <p className="font-bold text-lg">{nextYearList.length}</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1.5 text-center">
                <p className="text-xs text-violet-100">FY</p>
                <p className="font-bold text-lg">2025-26</p>
              </div>
            </div>
          </div>

          {/* Timeline hint */}
          <div className="flex items-center space-x-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <Calendar className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              <strong>Start early!</strong> Implementing these from April 2025 spreads investments across 12 months and reduces monthly TDS deduction.
            </p>
          </div>

          {/* Next Year Cards */}
          <div className="space-y-3">
            {nextYearList.map((rec, index) => (
              <NextYearCard key={index} rec={rec} index={index} />
            ))}
          </div>

          {nextYearList.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Next year planning recommendations will appear here after uploading your Form 16.</p>
            </div>
          )}
        </>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs text-gray-500 leading-relaxed">
          <strong>Disclaimer:</strong> These recommendations are provided by <strong>OJ Gnan</strong> based on information extracted from your Form 16 and current tax laws (FY 2024-25 / FY 2025-26).
          Please consult a qualified Chartered Accountant (CA) or tax advisor for personalized advice.
          Tax laws are subject to change; verify with the latest Income Tax Act provisions.
        </p>
      </div>
    </div>
  );
};

export default Recommendations;

// Made with Bob
