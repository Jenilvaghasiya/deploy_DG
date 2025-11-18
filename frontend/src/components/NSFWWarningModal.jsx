// components/NSFWWarningModal.jsx
import React from 'react';
import { AlertTriangle, X, Shield } from 'lucide-react';

const NSFWWarningModal = ({ isOpen, onClose, detectedContent, fileName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-zinc-900 rounded-2xl border border-red-500/30 shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border-b border-red-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Content Blocked</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-300 mb-3">
              The image you tried to upload has been blocked due to inappropriate content detection.
            </p>
            
            {/* Detection Details */}
            <div className="bg-red-950/30 border border-red-500/20 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="text-gray-400">File:</span>
                  <span className="text-white font-medium truncate">{fileName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400">
              Our system automatically scans all uploads to maintain a safe environment. 
              Please ensure your content follows our community guidelines.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

export default NSFWWarningModal;