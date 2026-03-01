import React, { useState } from 'react';
import {
  CheckCircle, AlertTriangle, AlertCircle, Info,
  TrendingUp, DollarSign, FileText,
  ChevronDown, ChevronUp, ExternalLink, RefreshCw
} from 'lucide-react';

const fmt = (n) => {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
};

const fmtNum = (n) => {
  if (!n && n !== 0) return '—';
  return Number(n).toLocaleString('en-IN');
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = 'blue', icon: Icon }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium opacity-75">{label}</p>
        {Icon && <Icon className="w-4 h-4 opacity-60" />}
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}

function AlertBadge({ severity }) {
  if (severity === 'high') return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Critical</span>;
  return <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Warning</span>;
}

function PriorityBadge({ priority }) {
  const map = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[priority] || map.low}`}>
      {priority?.charAt(0).toUpperCase() + priority?.slice(1)}
    </span>
  );
}

function ReconciliationCard({ reconciliation }) {
  if (!reconciliation) return null;
  const { form16TDS, form26TDS, difference, isMatching, status } = reconciliation;

  return (
    <div className={`rounded-xl border-2 p-5 ${isMatching ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center space-x-2 mb-4">
        {isMatching
          ? <CheckCircle className="w-5 h-5 text-green-600" />
          : <AlertCircle className="w-5 h-5 text-red-600" />
        }
        <h4 className={`font-bold text-base ${isMatching ? 'text-green-800' : 'text-red-800'}`}>
          TDS Reconciliation: {isMatching ? '✅ Match' : '⚠️ Mismatch Detected'}
        </h4>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Form 16 TDS</p>
          <p className="text-lg font-bold text-gray-800">{fmt(form16TDS)}</p>
        </div>
        <div className="text-center flex flex-col items-center justify-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isMatching ? 'bg-green-200' : 'bg-red-200'}`}>
            {isMatching ? '=' : '≠'}
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Form 26AS TDS</p>
          <p className="text-lg font-bold text-gray-800">{fmt(form26TDS)}</p>
        </div>
      </div>

      {!isMatching && (
        <div className={`rounded-lg p-3 ${status === 'FORM26AS_HIGHER' ? 'bg-blue-100' : 'bg-red-100'}`}>
          <p className={`text-sm font-medium ${status === 'FORM26AS_HIGHER' ? 'text-blue-800' : 'text-red-800'}`}>
            {status === 'FORM26AS_HIGHER'
              ? `Form 26AS shows ₹${fmtNum(difference)} more TDS — likely from other income sources (interest, rent, etc.)`
              : `Form 16 shows ₹${fmtNum(difference)} more TDS than Form 26AS — contact employer to deposit TDS`
            }
          </p>
        </div>
      )}

      {isMatching && (
        <p className="text-sm text-green-700">
          Your TDS records are consistent. You can safely file your ITR using these figures.
        </p>
      )}
    </div>
  );
}

function TDSSectionBreakdown({ tdsBySection }) {
  const entries = Object.entries(tdsBySection || {});
  if (entries.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h4 className="font-semibold text-gray-800 mb-3 flex items-center space-x-2">
        <FileText className="w-4 h-4 text-blue-500" />
        <span>TDS by Income Source</span>
      </h4>
      <div className="space-y-2">
        {entries.map(([section, data]) => (
          <div key={section} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <span className="text-sm font-medium text-gray-700">{data.label}</span>
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Sec {section}</span>
            </div>
            <span className="text-sm font-bold text-gray-800">{fmt(data.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HighValueTransactions({ transactions }) {
  if (!transactions || transactions.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
      <h4 className="font-semibold text-amber-800 mb-3 flex items-center space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <span>High-Value Transactions Reported (SFT/AIR)</span>
      </h4>
      <p className="text-xs text-amber-700 mb-3">
        These transactions are reported to the Income Tax Department and must be declared in your ITR.
      </p>
      <div className="space-y-2">
        {transactions.map((txn, i) => (
          <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-100">
            <span className="text-sm text-gray-700">{txn.type}</span>
            <span className="text-sm font-bold text-amber-800">{fmt(txn.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightCard({ item, type }) {
  const [expanded, setExpanded] = useState(false);

  const bgColors = {
    alert: 'bg-red-50 border-red-200',
    warning: 'bg-amber-50 border-amber-200',
    positive: 'bg-green-50 border-green-200',
    recommendation: 'bg-blue-50 border-blue-200',
  };

  const hasAction = item.action || (item.actionItems && item.actionItems.length > 0);

  return (
    <div className={`rounded-xl border p-4 ${bgColors[type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-xl flex-shrink-0">{item.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 flex-wrap gap-1 mb-1">
              <h5 className="font-semibold text-gray-800 text-sm">{item.title}</h5>
              {item.severity && <AlertBadge severity={item.severity} />}
              {item.priority && <PriorityBadge priority={item.priority} />}
            </div>
            <p className="text-sm text-gray-600">{item.description}</p>

            {/* High-value transactions list */}
            {item.transactions && item.transactions.length > 0 && (
              <div className="mt-2 space-y-1">
                {item.transactions.map((txn, i) => (
                  <div key={i} className="flex justify-between text-xs bg-white rounded px-2 py-1 border border-amber-100">
                    <span>{txn.type}</span>
                    <span className="font-medium">{fmt(txn.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {hasAction && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-2 text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {expanded && hasAction && (
        <div className="mt-3 ml-8 pt-3 border-t border-gray-200">
          {item.action && (
            <p className="text-sm font-medium text-gray-700 mb-2">
              <span className="text-blue-600">→ Action: </span>{item.action}
            </p>
          )}
          {item.actionItems && item.actionItems.length > 0 && (
            <ul className="space-y-1">
              {item.actionItems.map((a, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start space-x-1">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Form26ASSummary({ data, onReupload }) {
  const [activeSection, setActiveSection] = useState('overview');

  if (!data) return null;

  const { form26asData, insights } = data;
  const { summary, partA, partC, partD, highValueTransactions, tdsBySection } = form26asData;

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'reconciliation', label: 'TDS Reconciliation', badge: insights.reconciliation && !insights.reconciliation.isMatching ? '!' : null },
    { id: 'insights', label: `Insights (${(insights.alerts?.length || 0) + (insights.warnings?.length || 0) + (insights.positives?.length || 0)})` },
    { id: 'recommendations', label: `Actions (${insights.recommendations?.length || 0})` },
    { id: 'details', label: 'Details' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Form 26AS Analysis</h2>
              <p className="text-sm text-gray-500">
                {form26asData.name && <span className="font-medium text-gray-700">{form26asData.name} • </span>}
                {form26asData.pan && <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{form26asData.pan}</span>}
                {form26asData.assessmentYear && <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">AY {form26asData.assessmentYear}</span>}
              </p>
            </div>
          </div>
          {onReupload && (
            <button
              onClick={onReupload}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-upload</span>
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <StatCard
            label="Total TDS Credited"
            value={fmt(summary.totalTDS)}
            sub="All sources"
            color="blue"
            icon={DollarSign}
          />
          <StatCard
            label="Advance Tax"
            value={fmt(summary.advanceTax)}
            sub="Part C"
            color={summary.advanceTax > 0 ? 'green' : 'amber'}
            icon={TrendingUp}
          />
          <StatCard
            label="Self-Assessment Tax"
            value={fmt(summary.selfAssessmentTax)}
            sub="Part C"
            color={summary.selfAssessmentTax > 0 ? 'emerald' : 'amber'}
            icon={TrendingUp}
          />
          <StatCard
            label="Total Tax Paid"
            value={fmt(summary.totalTaxesPaid)}
            sub="TDS + Advance + SAT"
            color="purple"
            icon={DollarSign}
          />
        </div>

        {/* Alert summary bar */}
        {(insights.alerts?.length > 0 || insights.warnings?.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {insights.alerts?.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-medium text-red-700">{insights.alerts.length} Critical Alert{insights.alerts.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {insights.warnings?.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-medium text-amber-700">{insights.warnings.length} Warning{insights.warnings.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {insights.positives?.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-medium text-green-700">{insights.positives.length} Positive{insights.positives.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center space-x-1.5 px-5 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-all
                ${activeSection === sec.id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <span>{sec.label}</span>
              {sec.badge && (
                <span className="w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {sec.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TDS Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">TDS Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Salary TDS (Sec 192)</span>
                      <span className="font-medium">{fmt(partA.salaryTDS)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Other TDS</span>
                      <span className="font-medium">{fmt(partA.otherTDS)}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2 font-semibold">
                      <span>Total TDS</span>
                      <span className="text-blue-700">{fmt(summary.totalTDS)}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Payments */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">Tax Payments</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Advance Tax</span>
                      <span className="font-medium">{fmt(summary.advanceTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Self-Assessment Tax</span>
                      <span className="font-medium">{fmt(summary.selfAssessmentTax)}</span>
                    </div>
                    {summary.totalRefund > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Refund Received</span>
                        <span className="font-medium text-green-600">{fmt(summary.totalRefund)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2 font-semibold">
                      <span>Total Taxes Paid</span>
                      <span className="text-purple-700">{fmt(summary.totalTaxesPaid)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* TDS by Section */}
              <TDSSectionBreakdown tdsBySection={tdsBySection} />

              {/* High Value Transactions */}
              <HighValueTransactions transactions={highValueTransactions} />

              {/* Quick link to TRACES */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Verify on Income Tax Portal</p>
                  <p className="text-xs text-blue-600">Always cross-check Form 26AS on the official portal before filing ITR</p>
                </div>
                <a
                  href="https://www.incometax.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                >
                  <span>Open Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Reconciliation */}
          {activeSection === 'reconciliation' && (
            <div className="space-y-4">
              {insights.reconciliation ? (
                <>
                  <ReconciliationCard reconciliation={insights.reconciliation} />
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-700 mb-2 text-sm">What to do next?</h4>
                    <ul className="space-y-1.5 text-sm text-gray-600">
                      {insights.reconciliation.isMatching ? (
                        <>
                          <li className="flex items-start space-x-2"><span className="text-green-500">✓</span><span>TDS figures match — proceed with ITR filing</span></li>
                          <li className="flex items-start space-x-2"><span className="text-green-500">✓</span><span>Use Form 26AS TDS figures in your ITR for accuracy</span></li>
                          <li className="flex items-start space-x-2"><span className="text-green-500">✓</span><span>Claim all TDS credits shown in Form 26AS</span></li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-start space-x-2"><span className="text-red-500">!</span><span>Contact your employer's HR/Finance team immediately</span></li>
                          <li className="flex items-start space-x-2"><span className="text-red-500">!</span><span>Ask them to verify TDS deposit on TRACES portal</span></li>
                          <li className="flex items-start space-x-2"><span className="text-red-500">!</span><span>Wait for Form 26AS to update before filing ITR</span></li>
                          <li className="flex items-start space-x-2"><span className="text-amber-500">→</span><span>File ITR only after mismatch is resolved to avoid processing issues</span></li>
                        </>
                      )}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Upload Form 16 first to enable TDS reconciliation</p>
                </div>
              )}
            </div>
          )}

          {/* Insights */}
          {activeSection === 'insights' && (
            <div className="space-y-4">
              {insights.alerts?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center space-x-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>Critical Alerts</span>
                  </h4>
                  <div className="space-y-2">
                    {insights.alerts.map((item, i) => (
                      <InsightCard key={i} item={item} type="alert" />
                    ))}
                  </div>
                </div>
              )}

              {insights.warnings?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center space-x-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Warnings</span>
                  </h4>
                  <div className="space-y-2">
                    {insights.warnings.map((item, i) => (
                      <InsightCard key={i} item={item} type="warning" />
                    ))}
                  </div>
                </div>
              )}

              {insights.positives?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>Good News</span>
                  </h4>
                  <div className="space-y-2">
                    {insights.positives.map((item, i) => (
                      <InsightCard key={i} item={item} type="positive" />
                    ))}
                  </div>
                </div>
              )}

              {!insights.alerts?.length && !insights.warnings?.length && !insights.positives?.length && (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No specific insights generated</p>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {activeSection === 'recommendations' && (
            <div className="space-y-3">
              {insights.recommendations?.length > 0 ? (
                insights.recommendations.map((item, i) => (
                  <InsightCard key={i} item={item} type="recommendation" />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No action items — your tax records look good!</p>
                </div>
              )}
            </div>
          )}

          {/* Details */}
          {activeSection === 'details' && (
            <div className="space-y-4">
              {/* Part A Entries */}
              {partA.entries?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">Part A — TDS Deductors</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-3 py-2 text-xs font-medium text-gray-500 rounded-l-lg">Deductor</th>
                          <th className="px-3 py-2 text-xs font-medium text-gray-500">TAN</th>
                          <th className="px-3 py-2 text-xs font-medium text-gray-500 text-right rounded-r-lg">TDS Credited</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {partA.entries.map((entry, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-700">{entry.deductorName || '—'}</td>
                            <td className="px-3 py-2 font-mono text-xs text-gray-500">{entry.tan || '—'}</td>
                            <td className="px-3 py-2 text-right font-medium text-gray-800">{fmt(entry.tdsCredited)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-blue-50">
                          <td colSpan={2} className="px-3 py-2 text-sm font-semibold text-blue-700">Total</td>
                          <td className="px-3 py-2 text-right font-bold text-blue-700">{fmt(partA.totalTDS)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Part C Payments */}
              {(partC.advanceTax > 0 || partC.selfAssessmentTax > 0) && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">Part C — Tax Payments</h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    {partC.advanceTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Advance Tax</span>
                        <span className="font-medium">{fmt(partC.advanceTax)}</span>
                      </div>
                    )}
                    {partC.selfAssessmentTax > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Self-Assessment Tax</span>
                        <span className="font-medium">{fmt(partC.selfAssessmentTax)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Part D Refunds */}
              {partD?.refunds?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">Part D — Refunds</h4>
                  <div className="space-y-2">
                    {partD.refunds.map((r, i) => (
                      <div key={i} className="flex justify-between text-sm bg-green-50 rounded-lg px-3 py-2">
                        <span className="text-gray-600">AY {r.assessmentYear}</span>
                        <span className="font-medium text-green-700">{fmt(r.refundAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No details */}
              {partA.entries?.length === 0 && partC.advanceTax === 0 && partC.selfAssessmentTax === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Detailed entries could not be extracted from this Form 26AS format.</p>
                  <p className="text-xs mt-1">Summary totals are shown in the Overview tab.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Made with Bob