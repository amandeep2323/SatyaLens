import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileImage,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Eye,
  Cpu,
  Brain,
  Shield,
  Database,
  Zap
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
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFile = (selectedFile) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      setResult(null);
      setError(null);

      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://127.0.0.1:4242/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed. Is the backend running?');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLayer = (layerKey) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerKey]: !prev[layerKey]
    }));
  };

  const getVerdictColor = (verdict) => {
    if (verdict?.includes('Real') || verdict?.includes('Clean') || verdict?.includes('Consistent')) {
      return { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', icon: CheckCircle2 };
    }
    if (verdict?.includes('AI') || verdict?.includes('Likely')) {
      return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: XCircle };
    }
    if (verdict?.includes('Suspicious') || verdict?.includes('Edited')) {
      return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: AlertTriangle };
    }
    return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: Activity };
  };

  const layerIcons = {
    l0_bitstream: Database,
    l1_metadata: Eye,
    l2_forensics: Shield,
    l3_frequency: Activity,
    l4_semantic: Brain
  };

  const layerColors = {
    l0_bitstream: 'from-cyan-500 to-blue-500',
    l1_metadata: 'from-violet-500 to-purple-500',
    l2_forensics: 'from-orange-500 to-amber-500',
    l3_frequency: 'from-pink-500 to-rose-500',
    l4_semantic: 'from-emerald-500 to-teal-500'
  };

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative rounded-3xl border-2 border-dashed transition-all duration-300 ${
            dragActive
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-gray-300 dark:border-slate-600 hover:border-orange-400 dark:hover:border-orange-500'
          } ${preview ? 'p-6' : 'p-12'}`}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          {preview ? (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Preview Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full lg:w-64 h-48 rounded-2xl overflow-hidden bg-slate-800 flex-shrink-0"
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-medium truncate text-sm">{file?.name}</p>
                  <p className="text-gray-300 text-xs">{(file?.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </motion.div>

              {/* File Info & Actions */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
                    <FileImage className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{file?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {file?.type} • Ready for analysis
                    </p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 ${
                    loading
                      ? 'bg-gray-400 dark:bg-slate-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 hover:shadow-xl hover:shadow-orange-500/30 text-white'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing Layers...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Run 7-Layer Analysis</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shadow-xl"
              >
                <Upload className="w-10 h-10 text-white" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Drop your image here
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                or click to browse files
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Supports: JPEG, PNG, WebP, GIF
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
          >
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Final Verdict Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-6 rounded-2xl ${getVerdictColor(result.final_verdict).bg} border ${getVerdictColor(result.final_verdict).border}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  {React.createElement(getVerdictColor(result.final_verdict).icon, {
                    className: `w-10 h-10 ${getVerdictColor(result.final_verdict).text}`
                  })}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {result.final_verdict}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">Final Analysis Result</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black gradient-text">
                    {result.final_score}%
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Confidence Score</p>
                </div>
              </div>

              {/* Score Progress Bar */}
              <div className="mt-6">
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.final_score}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      result.final_score > 75
                        ? 'bg-gradient-to-r from-red-500 to-rose-500'
                        : result.final_score > 50
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                        : result.final_score > 25
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500'
                    }`}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Authentic</span>
                  <span>Suspicious</span>
                  <span>AI Generated</span>
                </div>
              </div>
            </motion.div>

            {/* Layer Results */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-500" />
                Layer Analysis Results
              </h3>

              {result.layers && Object.entries(result.layers).map(([key, layer], index) => {
                const LayerIcon = layerIcons[key] || Activity;
                const colorGradient = layerColors[key] || 'from-gray-500 to-slate-500';
                const isExpanded = expandedLayers[key];

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 overflow-hidden"
                  >
                    {/* Layer Header */}
                    <button
                      onClick={() => toggleLayer(key)}
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorGradient} flex items-center justify-center shadow-lg`}>
                          <LayerIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {layer.layer_name?.replace(/_/g, ' ') || key.replace(/_/g, ' ')}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {layer.flags?.length > 0 ? `${layer.flags.length} flag(s) detected` : 'No anomalies'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            layer.score > 70 ? 'text-red-400' :
                            layer.score > 40 ? 'text-amber-400' : 'text-green-400'
                          }`}>
                            {layer.score}/100
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {/* Layer Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-200 dark:border-slate-700"
                        >
                          <div className="p-4 space-y-4">
                            {/* Flags */}
                            {layer.flags?.length > 0 ? (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Detected Flags
                                </h5>
                                <div className="space-y-2">
                                  {layer.flags.map((flag, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                                    >
                                      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                      <span className="text-red-300 text-sm">{flag}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                <span className="text-green-300 text-sm">No anomalies detected in this layer</span>
                              </div>
                            )}

                            {/* Technical Details */}
                            {layer.details && Object.keys(layer.details).length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Technical Metrics
                                </h5>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                  {Object.entries(layer.details).map(([key, value]) => (
                                    <div
                                      key={key}
                                      className="p-3 rounded-lg bg-gray-100 dark:bg-slate-700/50"
                                    >
                                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                                        {key.replace(/_/g, ' ')}
                                      </p>
                                      <p className="text-sm font-mono font-semibold text-orange-500 mt-1">
                                        {typeof value === 'number' ? value.toFixed(4) : String(value)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Visual Evidence */}
                            {(layer.ela_image || layer.spectrum_image) && (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Visual Evidence
                                </h5>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  {layer.ela_image && (
                                    <div className="rounded-xl overflow-hidden bg-slate-900 p-2">
                                      <p className="text-xs text-gray-400 mb-2 px-2">ELA Heatmap</p>
                                      <img
                                        src={`data:image/jpeg;base64,${layer.ela_image}`}
                                        alt="ELA Analysis"
                                        className="w-full rounded-lg"
                                      />
                                    </div>
                                  )}
                                  {layer.spectrum_image && (
                                    <div className="rounded-xl overflow-hidden bg-slate-900 p-2">
                                      <p className="text-xs text-gray-400 mb-2 px-2">Frequency Spectrum</p>
                                      <img
                                        src={`data:image/jpeg;base64,${layer.spectrum_image}`}
                                        alt="Frequency Analysis"
                                        className="w-full rounded-lg"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadZone;
