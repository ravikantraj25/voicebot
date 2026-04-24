/**
 * Batch Upload Component
 * Upload a CSV file to initiate calls to multiple customers at once
 * CSV format: phoneNumber,language (one per line)
 */
import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Loader2, X, Users, Phone } from 'lucide-react';

const BatchUpload = ({ onBatchCall, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter((line) => line.trim());

        // Skip header if present
        const startIndex = lines[0]?.toLowerCase().includes('phone') ? 1 : 0;

        const parsed = [];
        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim());
          if (parts.length >= 1 && parts[0]) {
            parsed.push({
              phoneNumber: parts[0],
              language: parts[1] || 'english',
            });
          }
        }

        if (parsed.length === 0) {
          setError('No valid entries found in CSV');
          return;
        }

        setCsvData(parsed);
      } catch (err) {
        setError('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (csvData.length > 0) {
      onBatchCall(csvData);
      setIsOpen(false);
      setCsvData([]);
      setFileName('');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCsvData([]);
    setFileName('');
    setError('');
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary flex items-center gap-2 w-full justify-center text-sm"
        type="button"
      >
        <Users size={16} />
        Batch Call (CSV)
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div
            className="relative glass-card p-6 max-w-md w-full animate-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-purple-500/20 border border-brand-500/20 flex items-center justify-center">
                  <FileSpreadsheet size={20} className="text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-100">
                    Batch Call
                  </h3>
                  <p className="text-sm text-surface-400">
                    Upload CSV to call multiple customers
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-surface-700 text-surface-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Upload Area */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-surface-600 rounded-xl p-8 text-center cursor-pointer hover:border-brand-500/50 hover:bg-surface-800/30 transition-all duration-300"
            >
              <Upload size={32} className="text-surface-400 mx-auto mb-3" />
              <p className="text-sm text-surface-300 font-medium">
                {fileName || 'Click to upload CSV file'}
              </p>
              <p className="text-xs text-surface-500 mt-1">
                Format: phoneNumber,language
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-red-400 mt-3">{error}</p>
            )}

            {/* Preview */}
            {csvData.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-surface-300 mb-2">
                  📋 {csvData.length} contacts found:
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {csvData.slice(0, 10).map((entry, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 bg-surface-800/50 rounded-lg text-xs"
                    >
                      <span className="text-surface-200">{entry.phoneNumber}</span>
                      <span className="text-surface-400 capitalize">
                        {entry.language}
                      </span>
                    </div>
                  ))}
                  {csvData.length > 10 && (
                    <p className="text-xs text-surface-500 text-center py-1">
                      +{csvData.length - 10} more...
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* CSV Template */}
            <div className="mt-4 p-3 bg-surface-800/50 rounded-xl">
              <p className="text-xs font-semibold text-surface-400 mb-1">
                Example CSV:
              </p>
              <code className="text-xs text-brand-300 block">
                phoneNumber,language{'\n'}
                +919876543210,hindi{'\n'}
                +919876543211,english{'\n'}
                +919876543212,kannada
              </code>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={csvData.length === 0 || isLoading}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Phone size={18} />
                  Start {csvData.length} Call{csvData.length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};


export default BatchUpload;
