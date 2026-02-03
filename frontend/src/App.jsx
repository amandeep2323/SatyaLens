import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  Activity,
  Zap,
  Brain,
  Upload,
  Menu,
  X,
  Moon,
  Sun,
  CheckCircle2,
  AlertTriangle,
  FileImage,
  Layers,
  Eye,
  Cpu,
  Sparkles,
  TrendingUp,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';
import UploadZone from './components/UploadZone';
import './App.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950' : 'bg-white'}`}>
      {/* Navigation */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/80 dark:bg-slate-950/90 backdrop-blur-2xl border-b border-orange-200/50 dark:border-slate-700/50 shadow-lg shadow-orange-500/10'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
            <motion.a
              href="/"
              className="flex items-center cursor-pointer group"
              whileHover={{ scale: 1.05 }}
              onClick={(e) => {
                e.preventDefault();
                setShowAnalyze(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <span className="text-3xl satya-brand tracking-tighter gradient-text">
                SatyaLens
              </span>
              <Eye className="w-6 h-6 ml-2 text-orange-500" />
            </motion.a>

            <div className="hidden lg:flex items-center gap-6">
              <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors font-medium">Features</a>
              <a href="#technology" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors font-medium">Technology</a>
              <a href="#about" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors font-medium">About</a>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAnalyze(true)}
                className="px-6 py-2.5 bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white rounded-full font-bold shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 transition-all duration-300 border border-white/20"
              >
                Analyze Now
              </motion.button>
            </div>

            <button
              className="lg:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950"
            >
              <div className="px-6 py-4 space-y-4">
                <a href="#features" className="block text-gray-700 dark:text-gray-300">Features</a>
                <a href="#technology" className="block text-gray-700 dark:text-gray-300">Technology</a>
                <a href="#about" className="block text-gray-700 dark:text-gray-300">About</a>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="w-full py-2 text-left text-gray-700 dark:text-gray-300"
                >
                  {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button
                  onClick={() => { setShowAnalyze(true); setIsMobileMenuOpen(false); }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full font-bold"
                >
                  Analyze Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {showAnalyze ? (
          <AnalyzeSection key="analyze" onBack={() => setShowAnalyze(false)} />
        ) : (
          <LandingPage key="landing" onAnalyze={() => setShowAnalyze(true)} />
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function LandingPage({ onAnalyze }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-rose-100 to-pink-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <motion.div
            animate={{ x: [0, 100, -50, 0], y: [0, -80, 60, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/40 to-pink-400/40 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ x: [0, -70, 40, 0], y: [0, 50, -40, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-tr from-rose-400/30 to-amber-400/30 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 dark:bg-slate-800/70 rounded-full border border-orange-200 dark:border-orange-900/30 backdrop-blur-sm"
            >
              <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">Advanced AI Detection</span>
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-black text-gray-900 dark:text-white leading-tight">
              Unmask the <span className="gradient-text">Truth</span>
              <br />
              in Digital Media
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-lg">
              SatyaLens uses multi-layer forensic analysis to detect AI-generated content,
              manipulated images, and deepfakes with unparalleled accuracy.
            </p>

            <div className="flex flex-wrap gap-4">
              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
                onClick={onAnalyze}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500 text-white rounded-full font-bold text-lg shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all duration-300 flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Start Analysis
              </motion.button>

              <motion.a
                href="#features"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-full font-bold text-lg hover:border-orange-400 dark:hover:border-orange-500 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-300"
              >
                Learn More
              </motion.a>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              {[
                { value: '7', label: 'Detection Layers' },
                { value: '99%', label: 'Accuracy' },
                { value: '<3s', label: 'Analysis Time' }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl font-black gradient-text">{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Demo Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <DemoCard />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Technology Section */}
      <TechnologySection />

      {/* CTA Section */}
      <CTASection onAnalyze={onAnalyze} />
    </motion.div>
  );
}

function DemoCard() {
  return (
    <motion.div
      className="relative rounded-3xl bg-slate-900 border border-white/10 p-6 shadow-2xl shadow-black/50 overflow-hidden"
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.15),_transparent_50%)]" />
      
      {/* Window Controls */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-auto text-xs uppercase tracking-widest text-white/40">LIVE ANALYSIS</span>
      </div>

      {/* Analysis Demo */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center">
            <FileImage className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold">suspicious_image.jpg</p>
            <p className="text-gray-400 text-sm">2.4 MB • Uploaded just now</p>
          </div>
        </div>

        {/* Progress Bars */}
        {[
          { name: 'Bitstream Analysis', progress: 100, status: 'complete' },
          { name: 'Metadata Extraction', progress: 100, status: 'complete' },
          { name: 'Forensic Detection', progress: 100, status: 'complete' },
          { name: 'Frequency Analysis', progress: 85, status: 'running' },
          { name: 'Semantic Analysis', progress: 0, status: 'pending' }
        ].map((layer, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{layer.name}</span>
              <span className={layer.status === 'complete' ? 'text-green-400' : layer.status === 'running' ? 'text-orange-400' : 'text-gray-500'}>
                {layer.status === 'complete' ? '✓' : layer.status === 'running' ? `${layer.progress}%` : 'Pending'}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${layer.progress}%` }}
                transition={{ duration: 1, delay: i * 0.2 }}
                className={`h-full rounded-full ${
                  layer.status === 'complete' ? 'bg-green-500' : 'bg-gradient-to-r from-orange-500 to-pink-500'
                }`}
              />
            </div>
          </div>
        ))}

        {/* Result Preview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-amber-200 font-semibold">Suspicious Content Detected</p>
              <p className="text-amber-300/70 text-sm">AI confidence: 78%</p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Layers,
      title: '7-Layer Analysis',
      desc: 'Multi-dimensional forensic analysis from bitstream to semantic understanding',
      gradient: 'from-orange-500 to-amber-500'
    },
    {
      icon: Brain,
      title: 'AI-Powered Detection',
      desc: 'Advanced neural networks trained on millions of authentic and synthetic images',
      gradient: 'from-pink-500 to-rose-500'
    },
    {
      icon: Cpu,
      title: 'Frequency Analysis',
      desc: 'Deep spectral analysis to detect GAN fingerprints and compression artifacts',
      gradient: 'from-purple-500 to-violet-500'
    },
    {
      icon: Shield,
      title: 'Forensic Grade',
      desc: 'Professional-grade detection suitable for journalism and legal verification',
      gradient: 'from-cyan-500 to-blue-500'
    }
  ];

  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            FEATURES
          </span>
          <h2 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-6">
            Cutting-Edge <span className="gradient-text">Detection</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Comprehensive forensic analysis powered by state-of-the-art AI technology
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechnologySection() {
  const layers = [
    { name: 'L0 - Bitstream', desc: 'Raw file structure analysis', weight: '10%' },
    { name: 'L1 - Metadata', desc: 'EXIF and header examination', weight: '10%' },
    { name: 'L2 - Forensics', desc: 'ELA and noise pattern detection', weight: '20%' },
    { name: 'L3 - Frequency', desc: 'Spectral and FFT analysis', weight: '25%' },
    { name: 'L4 - Semantic', desc: 'AI content understanding', weight: '20%' },
    { name: 'L5 - Deep Learning', desc: 'Neural network classification', weight: '10%' },
    { name: 'L6 - Judge', desc: 'Final verdict aggregation', weight: '5%' }
  ];

  return (
    <section id="technology" className="py-24 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-semibold mb-4">
              <Activity className="w-4 h-4" />
              TECHNOLOGY
            </span>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-6">
              7-Layer Detection <span className="gradient-text">Engine</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Our proprietary multi-layer analysis system examines media at every level,
              from raw bytes to semantic meaning, ensuring no manipulation goes undetected.
            </p>
            
            <div className="space-y-4">
              {layers.map((layer, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    L{i}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">{layer.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{layer.desc}</p>
                  </div>
                  <span className="text-orange-500 font-bold">{layer.weight}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="rounded-3xl bg-slate-900 p-8 shadow-2xl border border-white/10">
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.2),_transparent_50%)]" />
              
              <h3 className="text-2xl font-bold text-white mb-6">Analysis Pipeline</h3>
              
              <div className="space-y-6">
                {[
                  { label: 'Precision Rate', value: 97.4, color: 'from-green-500 to-emerald-500' },
                  { label: 'Recall Rate', value: 94.2, color: 'from-blue-500 to-cyan-500' },
                  { label: 'F1 Score', value: 95.8, color: 'from-orange-500 to-amber-500' }
                ].map((metric, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">{metric.label}</span>
                      <span className="text-white font-semibold">{metric.value}%</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${metric.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.2 }}
                        className={`h-full rounded-full bg-gradient-to-r ${metric.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {[
                  { value: '10K+', label: 'Images Analyzed' },
                  { value: '< 3s', label: 'Avg Time' },
                  { value: '24/7', label: 'Availability' }
                ].map((stat, i) => (
                  <div key={i} className="text-center p-4 rounded-xl bg-white/5">
                    <div className="text-2xl font-black gradient-text">{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CTASection({ onAnalyze }) {
  return (
    <section className="py-24 bg-gradient-to-br from-orange-500 via-pink-500 to-rose-500 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIwOS0xLjc5LTQtNC00cy00IDEuNzkxLTQgNGMwIDIuMjEgMS43OSA0IDQgNHM0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6">
            Ready to Verify Truth?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Upload any image and let SatyaLens reveal the truth. 
            Our AI-powered analysis takes just seconds.
          </p>
          
          <motion.button
            whileHover={{ scale: 1.08, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAnalyze}
            className="px-10 py-5 bg-white text-gray-900 rounded-full font-bold text-xl shadow-2xl hover:shadow-white/30 transition-all duration-300 inline-flex items-center gap-3"
          >
            <Upload className="w-6 h-6" />
            Analyze Image Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

function AnalyzeSection({ onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-slate-900/50 py-12"
    >
      <div className="max-w-5xl mx-auto px-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -5 }}
          onClick={onBack}
          className="mb-8 text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors flex items-center gap-2 font-medium"
        >
          ← Back to Home
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
            Analyze Your <span className="gradient-text">Media</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Upload an image to run our 7-layer forensic analysis
          </p>
        </motion.div>

        <UploadZone />
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer id="about" className="bg-slate-900 dark:bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-3xl satya-brand gradient-text">SatyaLens</span>
              <Eye className="w-6 h-6 text-orange-500" />
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              Advanced AI-powered media forensics to protect truth in the digital age.
            </p>
            <div className="flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-orange-500 flex items-center justify-center transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: 'Product', items: ['Features', 'Technology', 'API Docs', 'Pricing'] },
            { title: 'Resources', items: ['Documentation', 'Blog', 'Research', 'Support'] },
            { title: 'Legal', items: ['Privacy', 'Terms', 'Security', 'Contact'] }
          ].map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-white mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400">© 2025 SatyaLens. All rights reserved.</p>
          <p className="text-gray-500 text-sm">Built with ❤️ for digital truth</p>
        </div>
      </div>
    </footer>
  );
}

export default App;
