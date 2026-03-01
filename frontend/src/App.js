import React, { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { FileText, BarChart2, Lightbulb, BookOpen, PenTool, RefreshCw, Calculator } from 'lucide-react';
import Form16Upload from './components/Form16Upload';
import TaxSummary from './components/TaxSummary';
import Recommendations from './components/Recommendations';
import DeductionsAnalyzer from './components/DeductionsAnalyzer';
import TaxSlabs from './components/TaxSlabs';
import ManualEntry from './components/ManualEntry';
import { uploadMultipleForm16 } from './services/taxApi';

const NAV_TABS = [
  { id: 'upload', label: 'Upload Form 16', icon: FileText },
  { id: 'summary', label: 'Tax Summary', icon: BarChart2, requiresData: true },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb, requiresData: true },
  { id: 'deductions', label: 'Deductions', icon: BookOpen, requiresData: true },
  { id: 'manual', label: 'Manual Entry', icon: PenTool },
  { id: 'slabs', label: 'Tax Slabs', icon: Calculator },
];

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [taxResult, setTaxResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // files = array of File objects, meta = array of {employerName, fromMonth, toMonth}
  const handleUpload = async (files, age, meta) => {
    setIsLoading(true);
    try {
      const result = await uploadMultipleForm16(files, age);
      if (result.success) {
        setTaxResult(result.data);
        setActiveTab('summary');
        const count = result.data.employerCount || files.length;
        toast.success(
          count > 1
            ? `${count} Form 16s analyzed & combined successfully!`
            : 'Form 16 analyzed successfully!'
        );
      } else {
        toast.error(result.error || 'Failed to analyze Form 16');
      }
    } catch (err) {
      toast.error(
        err.response?.data?.error ||
        err.message ||
        'Failed to connect to server. Please ensure the backend is running.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualResult = (data) => {
    setTaxResult(data);
    setActiveTab('summary');
    toast.success('Tax calculated successfully!');
  };

  const handleReset = () => {
    setTaxResult(null);
    setActiveTab('upload');
  };

  const tabs = NAV_TABS.filter(t => !t.requiresData || taxResult);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">OJ</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">OJ Gnan <span className="text-blue-600">Tax</span></h1>
                <p className="text-xs text-gray-500">by OJ Gnan • Indian Tax Filing Assistant • FY 2024-25</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {taxResult && (
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>New Analysis</span>
                </button>
              )}
              <span className="hidden md:block text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                AY 2025-26
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all
                    ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div>
            {!taxResult && (
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  OJ Gnan Tax Filing Assistant
                </h2>
                <p className="text-gray-500 max-w-xl mx-auto">
                  Upload your Form 16 to get instant tax analysis, regime comparison, and personalized recommendations to maximize your savings — powered by OJ Gnan.
                </p>
                <div className="flex justify-center gap-6 mt-6">
                  {[
                    { icon: '📊', label: 'Tax Analysis' },
                    { icon: '⚖️', label: 'Regime Comparison' },
                    { icon: '💡', label: 'Smart Recommendations' },
                    { icon: '💰', label: 'Maximize Savings' },
                  ].map((f, i) => (
                    <div key={i} className="text-center">
                      <div className="text-2xl mb-1">{f.icon}</div>
                      <p className="text-xs text-gray-500">{f.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Form16Upload
              onUpload={handleUpload}
              isLoading={isLoading}
              onManualEntry={() => setActiveTab('manual')}
            />
          </div>
        )}

        {/* Manual Entry */}
        {activeTab === 'manual' && (
          <ManualEntry
            onResult={handleManualResult}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}

        {/* Tax Summary */}
        {activeTab === 'summary' && taxResult && (
          <TaxSummary data={taxResult} />
        )}

        {/* Recommendations */}
        {activeTab === 'recommendations' && taxResult && (
          <Recommendations recommendations={taxResult.recommendations} />
        )}

        {/* Deductions */}
        {activeTab === 'deductions' && taxResult && (
          <DeductionsAnalyzer taxData={taxResult.taxData} />
        )}

        {/* Tax Slabs */}
        {activeTab === 'slabs' && (
          <TaxSlabs />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">OJ</span>
              </div>
              <div>
                <span className="font-bold text-gray-800">OJ Gnan</span>
                <span className="text-gray-400 text-xs ml-1">Tax Filing Assistant</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">
              © 2024 OJ Gnan • FY 2024-25 (AY 2025-26) • Not a substitute for professional tax advice
            </p>
            <div className="flex space-x-4 text-xs text-gray-400">
              <span>Income Tax Act, 1961</span>
              <span>•</span>
              <span>Finance Act 2024</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

// Made with Bob
