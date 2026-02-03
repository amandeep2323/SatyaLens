import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileImage, Loader2, CheckCircle2, AlertTriangle, XCircle, 
  ChevronDown, ChevronUp, Activity, Layers, Eye, Shield, Brain, Zap, Database,
  FileVideo
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
      const data = await response.json();
      setResult(data);
    } catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  const toggleLayer = (key) => setExpandedLayers(p => ({...p, [key]: !p[key]}));

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Sero-Style Upload Area */}
      <motion.div 
        layout
        className={`relative rounded-[2.5rem] overflow-hidden transition-all duration-300 ${
            dragActive ? 'scale-[1.02] shadow-2xl' : 'shadow-xl'
        } ${preview && !result ? 'bg-[#0a0a0a] border border-white/10' : 'bg-transparent'}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
      >
        {!preview ? (
          /* IDLE STATE: Sero Gradient Orb */
          <div className={`relative border-2 border-dashed rounded-[2.5rem] p-12 transition-all ${
             dragActive ? 'border-orange-500 bg-orange-500/5' : 'border-white/10 bg-[#0f0f0f]/50 hover:border-orange-500/30'
          }`}>
             <input type="file" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-50" />
             
             <div className="flex flex-col items-center gap-6 pointer-events-none">
                <motion.div
                  animate={dragActive ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="relative"
                >
                   <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 via-pink-500/20 to-purple-500/30 rounded-full blur-2xl" />
                   <div className="relative bg-gradient-to-br from-orange-500 to-pink-500 rounded-full p-6 shadow-2xl">
                      <Upload className="w-10 h-10 text-white" />
                   </div>
                </motion.div>
                
                <div className="text-center space-y-2">
                   <h3 className="text-xl font-bold text-white text-punched">
                      {dragActive ? 'Drop to Analyze' : 'Drop your image here'}
                   </h3>
                   <p className="text-white/60 text-sm">Supports JPEG, PNG, WebP • Max 50MB</p>
                </div>
             </div>
          </div>
        ) : (
          /* PREVIEW STATE */
          <div className="p-8">
             <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-full md:w-1/2 aspect-video bg-black/50 rounded-2xl overflow-hidden border border-white/10 relative group">
                   <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                   <button onClick={() => {setPreview(null); setFile(null);}} className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-red-500/50 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100">
                      <XCircle className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="w-full md:w-1/2 space-y-6">
                   <div>
                      <h3 className="text-2xl font-bold text-white truncate">{file.name}</h3>
                      <p className="text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                   </div>
                   
                   {!result && (
                      <button
                          onClick={handleUpload}
                          disabled={loading}
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                          {loading ? 'Analyzing Layers...' : 'Run Forensic Analysis'}
                      </button>
                   )}
                </div>
             </div>
          </div>
        )}
      </motion.div>

      {/* RESULTS DISPLAY */}
      <AnimatePresence>
        {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Main Verdict Card */}
                <div className="p-8 rounded-[2rem] bg-[#0f0f0f] border border-white/10 glass-card relative overflow-hidden">
                    <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] opacity-20 rounded-full ${result.final_score > 50 ? 'bg-red-500' : 'bg-green-500'}`} />
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-5">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${result.final_score > 50 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                {result.final_score > 50 ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-white">{result.final_verdict}</h2>
                                <p className="text-gray-400">AI Probability Score</p>
                            </div>
                        </div>
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 text-punched">
                            {result.final_score}%
                        </div>
                    </div>

                    <div className="mt-8 h-3 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${result.final_score}%` }}
                          transition={{ duration: 1.5, ease: "circOut" }}
                          className={`h-full ${result.final_score > 50 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-green-500 to-emerald-500'}`}
                       />
                    </div>
                </div>

                {/* Layer Details */}
                <div className="grid gap-4">
                    {result.layers && Object.entries(result.layers).map(([key, layer], i) => (
                        <div key={key} className="rounded-2xl bg-[#0a0a0a] border border-white/5 overflow-hidden">
                            <button 
                                onClick={() => toggleLayer(key)}
                                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                        <Layers className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <span className="font-semibold text-white capitalize text-lg">
                                        {key.replace(/_/g, ' ')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        layer.score > 50 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                    }`}>
                                        Score: {layer.score}
                                    </span>
                                    {expandedLayers[key] ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                </div>
                            </button>
                            
                            <AnimatePresence>
                                {expandedLayers[key] && (
                                    <motion.div 
                                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                        className="border-t border-white/5"
                                    >
                                        <div className="p-5 grid md:grid-cols-2 gap-6 text-sm">
                                            <div>
                                                <h4 className="font-medium text-white mb-3">Technical Details</h4>
                                                <div className="space-y-2 text-gray-400 font-mono text-xs">
                                                    {layer.details && Object.entries(layer.details).map(([k, v]) => (
                                                        <div key={k} className="flex justify-between p-2 bg-white/5 rounded">
                                                            <span>{k}:</span>
                                                            <span className="text-orange-400">{typeof v === 'number' ? v.toFixed(3) : v}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            {layer.ela_image && (
                                                <div className="aspect-video bg-black/50 rounded-lg overflow-hidden border border-white/10">
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