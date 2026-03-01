import React, { useState, useRef } from 'react';
import { Upload, FileText, Lock, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { uploadForm26AS } from '../services/taxApi';

/**
 * Form 26AS Upload Component
 * Allows users to upload their Form 26AS PDF for TDS reconciliation and insights.
 * Can be used standalone or alongside Form 16 data for cross-verification.
 */
export default function Form26ASUpload({ taxData, onResult, onClose }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a PDF file.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }
    setFile(selectedFile);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    handleFileSelect(dropped);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a Form 26AS PDF file.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Pass Form 16 taxData for cross-verification (if available)
      const form16DataForCrossRef = taxData?.taxData || null;
      const result = await uploadForm26AS(file, password, form16DataForCrossRef);
      if (result.success) {
        onResult(result.data);
      } else {
        setError(result.error || 'Failed to process Form 26AS.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to process Form 26AS.';
      if (msg.toLowerCase().includes('password')) {
        setError('Incorrect password. Form 26AS is usually password-protected with your PAN number (e.g., ABCDE1234F).');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Upload Form 26AS</h3>
            <p className="text-sm text-gray-500">Annual Tax Statement — TDS Credit Verification</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* What is Form 26AS */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5">
        <div className="flex items-start space-x-2">
          <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-emerald-800">
            <p className="font-semibold mb-1">What is Form 26AS?</p>
            <p className="text-emerald-700 mb-2">
              Form 26AS is your Annual Tax Statement from the Income Tax Department. It shows all TDS deducted on your income, advance tax paid, and high-value transactions reported to the IT department.
            </p>
            <div className="grid grid-cols-2 gap-1 text-xs text-emerald-700">
              <span>✓ TDS from salary (Section 192)</span>
              <span>✓ TDS from bank interest (194A)</span>
              <span>✓ Advance tax payments</span>
              <span>✓ Self-assessment tax</span>
              <span>✓ High-value transactions (SFT)</span>
              <span>✓ Tax refunds received</span>
            </div>
          </div>
        </div>
      </div>

      {/* How to download */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
        <p className="text-xs font-semibold text-blue-700 mb-1">📥 How to download Form 26AS:</p>
        <ol className="text-xs text-blue-700 space-y-0.5 list-decimal list-inside">
          <li>Login to <strong>incometax.gov.in</strong></li>
          <li>Go to <strong>e-File → Income Tax Returns → View Form 26AS</strong></li>
          <li>Select Assessment Year <strong>2025-26</strong></li>
          <li>Click <strong>Export as PDF</strong></li>
          <li>Password is usually your <strong>Date of Birth</strong> (DDMMYYYY)</li>
        </ol>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${isDragging
              ? 'border-emerald-400 bg-emerald-50'
              : file
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files[0])}
          />
          {file ? (
            <div className="flex flex-col items-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
              <p className="font-semibold text-emerald-700">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <Upload className="w-10 h-10 text-gray-300" />
              <div>
                <p className="font-medium text-gray-600">Drop Form 26AS PDF here</p>
                <p className="text-sm text-gray-400">or click to browse</p>
              </div>
              <p className="text-xs text-gray-400">PDF only • Max 10MB</p>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Lock className="w-3.5 h-3.5 inline mr-1 text-gray-400" />
            PDF Password <span className="text-gray-400 font-normal">(if password-protected)</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Usually Date of Birth: DDMMYYYY (e.g., 15081985)"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">
            Form 26AS from TRACES is usually password-protected with your Date of Birth in DDMMYYYY format.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Cross-verification notice */}
        {taxData && (
          <div className="flex items-start space-x-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              <strong>Form 16 detected!</strong> Form 26AS will be cross-verified with your Form 16 data for TDS reconciliation and mismatch detection.
            </p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || isLoading}
          className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all
            ${!file || isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow-md'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Analyzing Form 26AS...</span>
            </span>
          ) : (
            'Analyze Form 26AS'
          )}
        </button>
      </form>
    </div>
  );
}

// Made with Bob