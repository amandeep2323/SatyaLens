import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileImage, Loader2, CheckCircle2, AlertTriangle, XCircle, 
  ChevronDown, ChevronUp, Activity, Layers, Eye, Shield, Brain, Zap, Database
} from 'lucide-react';

const UploadZone = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [expandedLayers, setExpandedLayers] = useState({});

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleFile = (selectedFile) => {
    if (selectedFile?.type.startsWith('image/')) {
      setFile(selectedFile);
      setResult(null); setError(null);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:4242/analyze', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Analysis failed.');
      setResult(await response.json());
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  const toggleLayer = (key) => setExpandedLayers(p => ({...p, [key]: !p[key]}));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upload Area */}
      <motion.div 
        layout
        className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
            dragActive ? 'border-orange-500 bg-orange-500/5' : 'border-gray-200 dark:border-white/10 hover:border-orange-500/50'
        } ${preview ? 'p-8' : 'p-16'}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      >
        <input type="file" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
        
        {!preview ? (
          <div className="text-center pointer-events-none">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Drag & Drop Image</h3>
            <p className="text-gray-500 dark:text-gray-400">or click to browse files</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-8 items-center relative z-30">
            <div className="w-full md:w-1/2 aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            </div>
            <div className="w-full md:w-1/2 space-y-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{file.name}</h3>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                
                {!result && (
                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                        {loading ? 'Analyzing...' : 'Run Forensic Analysis'}
                    </button>
                )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Results */}
      <AnimatePresence>
        {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Main Verdict Card */}
                <div className={`p-8 rounded-2xl border ${
                    result.final_score > 50 ? 'bg-red-500/5 border-red-500/20' : 'bg-green-500/5 border-green-500/20'
                }`}>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            {result.final_score > 50 
                                ? <AlertTriangle className="w-12 h-12 text-red-500" /> 
                                : <CheckCircle2 className="w-12 h-12 text-green-500" />
                            }
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{result.final_verdict}</h2>
                                <p className="text-gray-500 dark:text-gray-400">AI Probability Score</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
                                {result.final_score}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Layer Details */}
                <div className="grid gap-4">
                    {result.layers && Object.entries(result.layers).map(([key, layer], i) => (
                        <div key={key} className="rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
                            <button 
                                onClick={() => toggleLayer(key)}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                                        <Layers className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        layer.score > 50 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                                    }`}>
                                        Score: {layer.score}
                                    </span>
                                    {expandedLayers[key] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </button>
                            
                            <AnimatePresence>
                                {expandedLayers[key] && (
                                    <motion.div 
                                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                        className="border-t border-gray-200 dark:border-white/10"
                                    >
                                        <div className="p-4 grid md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Technical Details</h4>
                                                <div className="space-y-1 text-gray-600 dark:text-gray-400 font-mono text-xs">
                                                    {layer.details && Object.entries(layer.details).map(([k, v]) => (
                                                        <div key={k} className="flex justify-between">
                                                            <span>{k}:</span>
                                                            <span>{typeof v === 'number' ? v.toFixed(3) : v}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {layer.ela_image && (
                                                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                                    <img src={`data:image/jpeg;base64,${layer.ela_image}`} className="w-full h-full object-contain" />
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadZone;