import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Shield, Upload, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';

const NSFWDetector = () => {
  const fileInputRef = useRef(null);
  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Load NSFW model using nsfwjs
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsLoading(true);
        addLog('🔄 Initializing TensorFlow.js...', 'info');
        
        // Set backend
        await tf.ready();
        addLog(`✅ TensorFlow backend: ${tf.getBackend()}`, 'success');
        
        addLog('📦 Loading NSFW model...', 'info');
        
        // Load the NSFW model using nsfwjs
        // You can specify model size: 'MobileNetV2' (default), 'MobileNetV2Mid', 'InceptionV3'
        const loadedModel = await nsfwjs.load();
        
        addLog('✅ NSFW model loaded successfully!', 'success');
        addLog('📊 Model ready for classification', 'info');
        
        setModel(loadedModel);
      } catch (error) {
        addLog(`❌ Failed to load model: ${error.message}`, 'error');
        console.error('Model load error:', error);
        setModelError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadModel();

    // Cleanup function
    return () => {
      if (model) {
        // Dispose of any tensors if needed
        tf.dispose();
      }
    };
  }, []);

  const checkImage = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = async () => {
        try {
          addLog(`📊 Analyzing ${file.name}...`, 'info');
          
          // Use nsfwjs to classify the image
          const predictions = await model.classify(img);
          URL.revokeObjectURL(url);
          
          // Log predictions
          addLog('━'.repeat(50), 'info');
          predictions.forEach(pred => {
            const barLength = Math.round(pred.probability * 20);
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            const percentage = (pred.probability * 100).toFixed(1);
            addLog(`${pred.className.padEnd(10)} ${bar} ${percentage}%`, 'info');
          });
          addLog('━'.repeat(50), 'info');
          
          // NSFW Detection Logic with STRICT thresholds
          const nsfwThresholds = {
            'Porn': 0.15,      // Very strict
            'Hentai': 0.15,    // Very strict
            'Sexy': 0.25       // Strict - will catch shirtless/suggestive
          };
          
          let isNSFW = false;
          let reason = null;
          let score = 0;
          
          for (const pred of predictions) {
            if (nsfwThresholds[pred.className] && pred.probability > nsfwThresholds[pred.className]) {
              isNSFW = true;
              reason = pred.className;
              score = pred.probability;
              break;
            }
          }
          
          // Combined NSFW score check
          const combinedNSFW = predictions
            .filter(p => ['Porn', 'Hentai', 'Sexy'].includes(p.className))
            .reduce((sum, p) => sum + p.probability, 0);
          
          addLog(`🔢 Combined NSFW score: ${(combinedNSFW * 100).toFixed(1)}%`, 'info');
          
          if (combinedNSFW > 0.35 && !isNSFW) {
            isNSFW = true;
            reason = 'Combined NSFW indicators';
            score = combinedNSFW;
          }
          
          const status = isNSFW ? '❌ BLOCKED' : '✅ SAFE';
          addLog(`${status}: ${file.name}`, isNSFW ? 'error' : 'success');
          
          if (isNSFW) {
            addLog(`  ⚠️ Reason: ${reason} (${(score * 100).toFixed(1)}%)`, 'error');
          } else {
            addLog(`  ℹ️ Top: ${predictions[0].className} (${(predictions[0].probability * 100).toFixed(1)}%)`, 'success');
          }
          
          resolve({
            file,
            isNSFW,
            reason,
            score,
            predictions,
            topCategory: predictions[0],
            combinedNSFW
          });
        } catch (error) {
          addLog(`❌ Classification error: ${error.message}`, 'error');
          console.error('Classification error:', error);
          URL.revokeObjectURL(url);
          resolve({ 
            file, 
            isNSFW: true, 
            error: error.message,
            reason: 'Detection error (blocked for safety)'
          });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        addLog(`❌ Failed to load image: ${file.name}`, 'error');
        resolve({ 
          file, 
          isNSFW: true, 
          error: 'Failed to load image',
          reason: 'Invalid image (blocked for safety)'
        });
      };
      
      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  };

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files || []);
    
    if (!files.length) {
      addLog('⚠️ No files selected', 'warning');
      return;
    }

    addLog(`\n📁 ${files.length} file(s) selected`, 'info');

    if (!model) {
      addLog('❌ Model not loaded yet!', 'error');
      alert('Model is not loaded. Please wait for it to finish loading.');
      event.target.value = '';
      return;
    }

    setIsChecking(true);
    setResults([]);

    const newResults = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      addLog(`\n[${i + 1}/${files.length}] Processing: ${file.name}`, 'info');
      
      if (!file.type.startsWith('image/')) {
        addLog(`⚠️ Skipping non-image file`, 'warning');
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        addLog(`⚠️ File too large (max 10MB)`, 'warning');
        continue;
      }

      const result = await checkImage(file);
      newResults.push(result);
    }

    setResults(newResults);
    setIsChecking(false);
    event.target.value = '';

    // Summary
    const safe = newResults.filter(r => !r.isNSFW).length;
    const blocked = newResults.filter(r => r.isNSFW).length;
    addLog(`\n📊 SUMMARY: ✅ ${safe} safe | ❌ ${blocked} blocked`, 'info');
  };

  // Function to clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog('🧹 Console cleared', 'info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-700">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">NSFW Content Detector</h1>
              <p className="text-slate-400 text-sm">Powered by NSFWJS & TensorFlow.js</p>
            </div>
          </div>

          {/* Model Status */}
          <div className="mb-6 p-4 rounded-xl bg-slate-900/50 border border-slate-700">
            <div className="flex items-center gap-3">
              {isLoading && (
                <>
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
                  <div>
                    <span className="text-blue-400 font-medium">Loading NSFWJS model...</span>
                    <p className="text-slate-500 text-sm">This may take a few seconds</p>
                  </div>
                </>
              )}
              {!isLoading && model && (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <span className="text-green-400 font-medium">Model Ready</span>
                    <p className="text-slate-500 text-sm">TensorFlow backend: {tf.getBackend()}</p>
                  </div>
                </>
              )}
              {!isLoading && modelError && (
                <>
                  <XCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <span className="text-red-400 font-medium">Failed to load</span>
                    <p className="text-slate-500 text-sm">{modelError}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Upload Button */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => {
                addLog('📁 Upload button clicked', 'info');
                fileInputRef.current?.click();
              }}
              disabled={isLoading || isChecking}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-blue-500/25"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing images...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Select Images to Test
                </>
              )}
            </button>
          </div>

          {/* Detection Info */}
          <div className="mb-6 p-4 rounded-xl bg-amber-900/20 border border-amber-700/50">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-amber-100 text-sm">
                <strong className="block mb-1">Detection Thresholds (STRICT):</strong>
                <ul className="space-y-1 text-amber-200/80">
                  <li>• Porn/Hentai: <strong>15%</strong> - Explicit content</li>
                  <li>• Sexy: <strong>25%</strong> - Suggestive/revealing content</li>
                  <li>• Combined NSFW: <strong>35%</strong> - Multiple indicators</li>
                </ul>
                <p className="mt-2 text-xs text-amber-300/70">
                  These strict thresholds will catch most inappropriate content including suggestive poses.
                </p>
                <div className="mt-3 pt-3 border-t border-amber-700/30">
                  <strong className="block text-amber-100">NSFWJS Classes:</strong>
                  <p className="text-xs text-amber-200/70 mt-1">
                    Drawing, Hentai, Neutral, Porn, Sexy
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>Results</span>
                <span className="text-sm font-normal text-slate-400">
                  ({results.filter(r => !r.isNSFW).length} safe, {results.filter(r => r.isNSFW).length} blocked)
                </span>
              </h2>
              <div className="space-y-3">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      result.isNSFW
                        ? 'bg-red-900/20 border-red-700/50'
                        : 'bg-green-900/20 border-green-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {result.isNSFW ? (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate mb-1">
                          {result.file.name}
                        </div>
                        
                        {result.isNSFW && (
                          <div className="text-sm text-red-300">
                            🚫 {result.reason} - {(result.score * 100).toFixed(1)}% confidence
                          </div>
                        )}
                        
                        {result.predictions && (
                          <div className="mt-2 space-y-1">
                            <div className="text-xs text-slate-400">
                              Top: {result.topCategory.className} ({(result.topCategory.probability * 100).toFixed(1)}%)
                            </div>
                            <div className="text-xs text-slate-400">
                              Combined NSFW: {(result.combinedNSFW * 100).toFixed(1)}%
                            </div>
                            
                            {/* Show all predictions in a mini bar chart */}
                            <div className="mt-2 space-y-0.5">
                              {result.predictions.slice(0, 3).map((pred, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <span className="text-slate-500 w-16 truncate">{pred.className}:</span>
                                  <div className="flex-1 bg-slate-700/50 rounded-full h-1.5">
                                    <div 
                                      className={`h-full rounded-full ${
                                        ['Porn', 'Hentai', 'Sexy'].includes(pred.className) 
                                          ? 'bg-red-500' 
                                          : 'bg-green-500'
                                      }`}
                                      style={{ width: `${pred.probability * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-slate-400 w-10 text-right">
                                    {(pred.probability * 100).toFixed(0)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Debug Console</h2>
              <button
                onClick={clearLogs}
                className="text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="bg-slate-950 rounded-xl p-4 max-h-96 overflow-y-auto font-mono text-xs border border-slate-800">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">Waiting for activity...</div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-relaxed ${
                      log.type === 'error'
                        ? 'text-red-400'
                        : log.type === 'success'
                        ? 'text-green-400'
                        : log.type === 'warning'
                        ? 'text-yellow-400'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-600">[{log.timestamp}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NSFWDetector;