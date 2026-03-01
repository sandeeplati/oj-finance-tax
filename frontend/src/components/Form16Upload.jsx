import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, User, Plus, Building2, Trash2, ChevronDown, ChevronUp, Lock } from 'lucide-react';

// Single employer Form 16 entry
const EmployerForm16 = ({ index, entry, onChange, onRemove, canRemove }) => {
  const [expanded, setExpanded] = useState(true);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      onChange(index, 'error', 'Please upload a valid PDF file (max 10MB).');
      return;
    }
    if (acceptedFiles.length > 0) {
      onChange(index, 'file', acceptedFiles[0]);
      onChange(index, 'error', '');
    }
  }, [index, onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const removeFile = (e) => {
    e.stopPropagation();
    onChange(index, 'file', null);
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Employer header */}
      <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700">
            Employer {index + 1}
            {entry.employerName && (
              <span className="ml-2 text-blue-600 font-normal">— {entry.employerName}</span>
            )}
          </span>
          {entry.file && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ PDF added</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {canRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="text-red-400 hover:text-red-600 transition p-1 rounded hover:bg-red-50"
              title="Remove this employer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(e => !e)}
            className="text-gray-400 hover:text-gray-600 transition p-1"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          {/* Employer name */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Employer / Company Name <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={entry.employerName}
              onChange={(e) => onChange(index, 'employerName', e.target.value)}
              placeholder="e.g. Infosys Ltd, TCS, etc."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
          </div>

          {/* PDF Password */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <Lock className="inline w-3 h-3 mr-1" />
              PDF Password <span className="text-gray-400">(if password-protected)</span>
            </label>
            <input
              type="password"
              value={entry.password}
              onChange={(e) => onChange(index, 'password', e.target.value)}
              placeholder="Usually your PAN number, e.g. ABCDE1234F"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font-mono tracking-wider"
              autoComplete="off"
            />
            <p className="text-xs text-gray-400 mt-1">
              💡 Most employer Form 16s are password-protected with your PAN number (uppercase)
            </p>
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">From Month</label>
              <select
                value={entry.fromMonth}
                onChange={(e) => onChange(index, 'fromMonth', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">To Month</label>
              <select
                value={entry.toMonth}
                onChange={(e) => onChange(index, 'toMonth', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                {['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
              ${entry.file ? 'border-green-400 bg-green-50' : ''}`}
          >
            <input {...getInputProps()} />
            {entry.file ? (
              <div className="flex items-center justify-center space-x-3">
                <div className="flex items-center bg-white rounded-lg px-3 py-2 shadow-sm border border-green-200">
                  <FileText className="w-5 h-5 text-green-600 mr-2" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{entry.file.name}</p>
                    <p className="text-xs text-gray-500">{(entry.file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="ml-3 text-gray-400 hover:text-red-500 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                {isDragActive ? (
                  <p className="text-blue-600 text-sm font-medium">Drop Form 16 here...</p>
                ) : (
                  <>
                    <p className="text-gray-600 text-sm font-medium">Drag & drop Form 16 PDF</p>
                    <p className="text-gray-400 text-xs mt-1">or <span className="text-blue-500 underline">browse files</span></p>
                  </>
                )}
              </div>
            )}
          </div>

          {entry.error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs">{entry.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const createEntry = (fromMonth = 'Apr', toMonth = 'Mar') => ({
  file: null,
  employerName: '',
  password: '',
  fromMonth,
  toMonth,
  error: '',
});

const Form16Upload = ({ onUpload, isLoading, onManualEntry }) => {
  const [age, setAge] = useState(30);
  const [formError, setFormError] = useState('');
  const [entries, setEntries] = useState([createEntry()]);

  const handleChange = useCallback((index, field, value) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  }, []);

  const addEmployer = () => {
    if (entries.length >= 5) return;
    setEntries(prev => [...prev, createEntry()]);
  };

  const removeEmployer = (index) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    const filesEntries = entries.filter(en => en.file);
    if (filesEntries.length === 0) {
      setFormError('Please upload at least one Form 16 PDF.');
      return;
    }
    if (age < 18 || age > 100) {
      setFormError('Please enter a valid age (18–100).');
      return;
    }

    const files = filesEntries.map(en => en.file);
    const passwords = filesEntries.map(en => en.password || '');
    const meta = filesEntries.map(en => ({
      employerName: en.employerName,
      fromMonth: en.fromMonth,
      toMonth: en.toMonth,
    }));

    onUpload(files, age, passwords, meta);
  };

  const hasAnyFile = entries.some(en => en.file);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Upload Form 16</h2>
          <p className="text-gray-500 mt-2">
            Upload your Form 16 PDF(s) to get personalized tax analysis from{' '}
            <span className="font-semibold text-blue-600">OJ Gnan</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Age Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="inline w-4 h-4 mr-1" />
              Your Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value) || 30)}
              min="18"
              max="100"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Enter your age"
            />
            <p className="text-xs text-gray-500 mt-1">Age affects tax slab selection (Senior: 60+, Super Senior: 80+)</p>
          </div>

          {/* Multiple employers notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start space-x-3">
            <Building2 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Changed jobs this year?</p>
              <p className="text-xs text-amber-700 mt-0.5">
                If you worked with multiple employers in FY 2024-25, add each employer's Form 16 below.
                All salary income and TDS will be combined for accurate tax calculation.
              </p>
            </div>
          </div>

          {/* Employer entries */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Form 16 PDF(s) — {entries.length} employer{entries.length > 1 ? 's' : ''}
            </label>
            {entries.map((entry, i) => (
              <EmployerForm16
                key={i}
                index={i}
                entry={entry}
                onChange={handleChange}
                onRemove={removeEmployer}
                canRemove={entries.length > 1}
              />
            ))}

            {/* Add employer button */}
            {entries.length < 5 && (
              <button
                type="button"
                onClick={addEmployer}
                className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-500 hover:bg-blue-50 transition text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Employer's Form 16</span>
              </button>
            )}
          </div>

          {/* Form-level error */}
          {formError && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{formError}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-800 mb-2">📋 What is Form 16?</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• TDS certificate issued by your employer</li>
              <li>• Contains salary details, deductions, and tax paid</li>
              <li>• Required for filing Income Tax Return (ITR)</li>
              <li>• Issued annually after the financial year ends</li>
              <li>• If you changed jobs, you'll have one Form 16 per employer</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !hasAnyFile}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200
              ${isLoading || !hasAnyFile
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg active:scale-95'
              }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Analyzing Form 16{entries.filter(e => e.file).length > 1 ? 's' : ''}...</span>
              </span>
            ) : (
              `🔍 Analyze ${entries.filter(e => e.file).length > 1 ? `${entries.filter(e => e.file).length} Form 16s` : 'Form 16'}`
            )}
          </button>
        </form>
      </div>

      {/* Manual Entry Option */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          Don't have Form 16?{' '}
          <button
            onClick={onManualEntry}
            className="text-blue-600 hover:underline font-medium"
          >
            Enter details manually
          </button>
        </p>
      </div>
    </div>
  );
};

export default Form16Upload;

// Made with Bob
