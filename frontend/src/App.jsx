import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Activity,
  Zap,
  Brain,
  Upload,
  Menu,
  X,
  Moon,
  Sun,
  Eye,
  Cpu,
  Sparkles,
  Layers,
  Github,
  Twitter,
  Linkedin,
  ArrowRight,
  CheckCircle2
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
    <div className={`min-h-screen font-sans selection:bg-orange-500/30 selection:text-orange-200 transition-colors duration-300 ${isDarkMode ? 'dark bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      
      {/* Navigation */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? 'bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-gray-200 dark:border-white/10'
            : 'bg-transparent border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.a
            href="/"
            className="flex items-center gap-2 group"
            onClick={(e) => {
              e.preventDefault();
              setShowAnalyze(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white">
              <Eye className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white group-hover:opacity-80 transition-opacity">
              SatyaLens
            </span>
          </motion.a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Technology', 'About'].map((item) => (
              <a 
                key={item}
                href={`#${item.toLowerCase()}`} 
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAnalyze(true)}
              className="px-5 py-2.5 rounded-lg bg-white dark:bg-white text-gray-900 font-semibold text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-shadow duration-300"
            >
              Launch App
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 dark:text-gray-300"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/10"
            >
              <div className="p-6 space-y-4">
                {['Features', 'Technology', 'About'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-gray-600 dark:text-gray-300 font-medium"
                  >
                    {item}
                  </a>
                ))}
                <button
                  onClick={() => { setShowAnalyze(true); setIsMobileMenuOpen(false); }}
                  className="w-full py-3 rounded-lg bg-orange-500 text-white font-bold"
                >
                  Launch App
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Layout */}
      <main className="pt-20">
        <AnimatePresence mode="wait">
          {showAnalyze ? (
            <AnalyzeSection key="analyze" onBack={() => setShowAnalyze(false)} />
          ) : (
            <LandingPage key="landing" onAnalyze={() => setShowAnalyze(true)} />
          )}
        </AnimatePresence>
      </main>

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
      transition={{ duration: 0.4 }}
    >
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-500/20 blur-[120px] rounded-full opacity-50 dark:opacity-30" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-pink-500/20 blur-[120px] rounded-full opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold tracking-wide uppercase"
            >
              <Sparkles className="w-3 h-3" />
              v2.0 Now Available
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white tracking-tight leading-[1.1]"
            >
              Verify Reality in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-rose-500">
                The AI Age
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              The advanced forensic tool for detecting deepfakes and AI-generated content with 99.8% precision.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <button
                onClick={onAnalyze}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Start Analysis
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 group"
              >
                Learn More
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>

            <div className="flex items-center justify-center lg:justify-start gap-8 pt-4">
              {[
                { label: 'Accuracy', value: '99.8%' },
                { label: 'Analysis Time', value: '<2s' },
                { label: 'Layers', value: '7' },
              ].map((stat, i) => (
                <div key={i} className="text-center lg:text-left">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
             <DemoCard />
          </div>
        </div>
      </section>

      <FeaturesSection />
      <TechnologySection />
    </motion.div>
  );
}

function DemoCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="relative rounded-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 flex items-center gap-2 bg-gray-50 dark:bg-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <div className="ml-4 text-xs font-mono text-gray-500">analysis_preview.jpg</div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">Scanning Image...</div>
            <div className="text-xs text-gray-500 mt-1">Found 3 artifacts</div>
            <div className="w-48 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
              <motion.div 
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
            {[
              { name: 'Metadata Check', status: 'Secure', color: 'text-green-500' },
              { name: 'Frequency Analysis', status: 'Anomalies', color: 'text-orange-500' },
              { name: 'ELA Projection', status: 'Processing', color: 'text-gray-400' }
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                <span className={`font-mono ${item.color}`}>{item.status}</span>
              </div>
            ))}
        </div>
      </div>
    </motion.div>
  );
}

function FeaturesSection() {
  const features = [
    { icon: Layers, title: 'Multi-Layer Analysis', desc: 'Analyzes files from bitstream level to semantic understanding.' },
    { icon: Brain, title: 'Neural Networks', desc: 'Trained on 10M+ authentic and synthetic image pairs.' },
    { icon: Cpu, title: 'Frequency Detection', desc: 'Identifies invisible artifacts left by GANs and diffusion models.' },
    { icon: Shield, title: 'Forensic Report', desc: 'Generates detailed, court-admissible PDF reports.' }
  ];

  return (
    <section id="features" className="py-32 bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Beyond Surface Level
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Most detectors look at pixels. SatyaLens looks at the math, physics, and metadata behind them.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechnologySection() {
    return (
        <section id="technology" className="py-32 bg-white dark:bg-[#0a0a0a]">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        The <span className="text-orange-500">7-Layer</span> Engine
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        Our proprietary engine peels back digital layers to reveal inconsistencies. 
                        While AI generators are getting better at fooling human eyes, they cannot hide the mathematical fingerprints they leave behind.
                    </p>
                    <div className="space-y-4">
                        {['Bitstream Structure', 'Metadata Consistency', 'ELA Forensics', 'Frequency Spectrum', 'Semantic Logic'].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                <span className="text-gray-800 dark:text-gray-200 font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 blur-3xl opacity-20" />
                    <div className="relative rounded-2xl bg-gray-900 border border-white/10 p-8 shadow-2xl">
                        <div className="space-y-6">
                            {[98, 85, 92, 99].map((val, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                                        <span>Layer {i + 1} Analysis</span>
                                        <span>{val}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${val}%` }}
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                            className="h-full bg-gradient-to-r from-orange-500 to-pink-500" 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function AnalyzeSection({ onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pb-20"
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="mb-8 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Forensic Lab</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload media to begin the 7-layer extraction process</p>
        </div>

        <UploadZone />
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white">
                <Eye className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">SatyaLens</span>
        </div>
        <div className="flex gap-6">
            <a href="#" className="text-gray-500 hover:text-orange-500 transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="text-gray-500 hover:text-orange-500 transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-gray-500 hover:text-orange-500 transition-colors"><Linkedin className="w-5 h-5" /></a>
        </div>
        <p className="text-sm text-gray-500">© 2025 SatyaLens. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default App;