import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, AlertCircle, User } from 'lucide-react';

const Form16Upload = ({ onUpload, isLoading }) => {
  const [file, setFile] = useState(null);
  const [age, setAge] = useState(30);
  const [error, setError] = useState('');

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('');
    if (rejectedFiles.length > 0) {
      setError('Please upload a valid PDF file (max 10MB).');
      return;
    }
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a Form 16 PDF file.'); return; }
    if (age < 18 || age > 100) { setError('Please enter a valid age (18-100).'); return; }
    onUpload(file, age);
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setError('');
  };

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
            Upload your Form 16 PDF to get personalized tax analysis and recommendations from <span className="font-semibold text-blue-600">OJ Gnan</span>
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

          {/* Dropzone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form 16 PDF
            </label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
                ${file ? 'border-green-400 bg-green-50' : ''}`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="flex items-center bg-white rounded-lg px-4 py-3 shadow-sm border border-green-200">
                    <FileText className="w-6 h-6 text-green-600 mr-3" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
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
                  <Upload className={`w-12 h-12 mx-auto mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                  {isDragActive ? (
                    <p className="text-blue-600 font-medium">Drop your Form 16 here...</p>
                  ) : (
                    <>
                      <p className="text-gray-600 font-medium">Drag & drop your Form 16 PDF</p>
                      <p className="text-gray-400 text-sm mt-1">or <span className="text-blue-500 underline">browse files</span></p>
                      <p className="text-gray-400 text-xs mt-2">PDF files only, max 10MB</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
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
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !file}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200
              ${isLoading || !file
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
                <span>Analyzing Form 16...</span>
              </span>
            ) : (
              '🔍 Analyze Form 16'
            )}
          </button>
        </form>
      </div>

      {/* Manual Entry Option */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          Don't have Form 16?{' '}
          <button className="text-blue-600 hover:underline font-medium">
            Enter details manually
          </button>
        </p>
      </div>
    </div>
  );
};

export default Form16Upload;

// Made with Bob
