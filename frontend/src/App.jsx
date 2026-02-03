import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Zap, Brain, Upload, Menu, X, Moon, Sun, 
  Eye, Cpu, Sparkles, Layers, Github, Twitter, Linkedin, 
  ArrowRight, CheckCircle2, Lock, Mail, LogIn, Loader2
} from 'lucide-react';
import UploadZone from './components/UploadZone';
// ❌ Remove this line: import './index.css'; 
// (It is now in main.jsx to prevent duplicates)

// --- FIREBASE IMPORTS ---
import { auth, googleProvider } from './firebase'; // This will now work
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

// ... (Rest of your App.jsx code remains exactly the same) ...

const LoginModal = ({ isOpen, onClose }) => {
  // ... existing code ...
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        if (formData.name) {
          await updateProfile(userCredential.user, { displayName: formData.name });
        }
      }
      onClose();
    } catch (err) {
      if (err.code === 'auth/invalid-credential') setError('Invalid email or password.');
      else if (err.code === 'auth/email-already-in-use') setError('Email already in use.');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters.');
      else setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden glass-card"
      >
        <div className="p-8 pb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-500/20 rounded-full blur-[50px] pointer-events-none" />
          <div className="relative z-10">
            <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-orange-500/20">
              <LogIn className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 text-punched">
              {isLogin ? 'Welcome Back' : 'Join SatyaLens'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isLogin ? 'Enter your credentials to access the lab' : 'Create an account to verify digital media'}
            </p>
          </div>
        </div>

        <div className="p-8 pt-0 space-y-6">
          <button 
            onClick={handleGoogleLogin}
            className="w-full h-12 rounded-xl bg-white text-gray-900 font-semibold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors shadow-lg shadow-white/5"
          >
            {/* Google Icon SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0a0a] text-gray-500">Or using email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
               <div className="space-y-2">
                 <div className="relative">
                   <input 
                     type="text" 
                     placeholder="Full Name"
                     required={!isLogin}
                     className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:outline-none transition-all"
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                   />
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                     <Eye className="w-4 h-4" />
                   </div>
                 </div>
               </div>
            )}

            <div className="space-y-2">
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <input 
                  type="password" 
                  placeholder="Password"
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAnalyze, setShowAnalyze] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  // --- FIREBASE AUTH LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          name: currentUser.displayName || currentUser.email.split('@')[0],
          email: currentUser.email,
          photo: currentUser.photoURL
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setShowAnalyze(false);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-orange-500/30 selection:text-orange-200 bg-background text-foreground transition-colors duration-300">
      
      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />

      {/* Navigation */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
          scrolled 
            ? 'bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-gray-200 dark:border-white/10' 
            : 'bg-transparent border-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.a 
            href="/" 
            className="flex items-center gap-2 group" 
            onClick={(e) => {
              e.preventDefault(); setShowAnalyze(false); window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Eye className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground group-hover:opacity-80 transition-opacity">
              SatyaLens
            </span>
          </motion.a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Technology', 'About'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {item}
              </a>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-muted-foreground transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground">Hi, {user.name}</span>
                <button onClick={handleLogout} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-foreground font-medium text-sm hover:bg-white/10 transition-all">
                  Sign Out
                </button>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => setShowAnalyze(true)} 
                  className="px-5 py-2.5 rounded-xl bg-white text-gray-900 font-bold text-sm shadow-lg shadow-white/10 hover:shadow-white/20 transition-all"
                >
                  Dashboard
                </motion.button>
              </div>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={() => setShowLogin(true)} 
                className="px-6 py-2.5 rounded-xl bg-white text-gray-900 font-bold text-sm shadow-lg shadow-white/10 hover:shadow-white/20 transition-all"
              >
                Sign In
              </motion.button>
            )}
          </div>

          <button className="md:hidden p-2 text-muted-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="pt-20">
        <AnimatePresence mode="wait">
          {showAnalyze && user ? (
            <AnalyzeSection key="analyze" onBack={() => setShowAnalyze(false)} />
          ) : (
            <LandingPage key="landing" onAnalyze={() => user ? setShowAnalyze(true) : setShowLogin(true)} />
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

function LandingPage({ onAnalyze }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Ambient Backgrounds */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-orange-500/20 blur-[120px] rounded-full opacity-50 dark:opacity-30 mix-blend-screen" />
          <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-pink-500/20 blur-[120px] rounded-full opacity-30 mix-blend-screen" />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3 h-3" /> v2.0 Now Available
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl lg:text-7xl font-bold text-foreground tracking-tight leading-[1.1] text-punched">
              Verify Reality in <br />
              <span className="gradient-text">The AI Age</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              The advanced forensic tool for detecting deepfakes and AI-generated content with 99.8% precision.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button onClick={onAnalyze} className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2">
                <Upload className="w-5 h-5" /> Start Analysis
              </button>
              <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-foreground font-semibold hover:bg-gray-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                Learn More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>
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
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="relative rounded-[2rem] bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden glass-card">
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-amber-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="ml-2 text-xs font-mono text-gray-500">analysis_preview.jpg</div>
      </div>
      <div className="p-8 space-y-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-orange-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Activity className="w-10 h-10 text-gray-400 relative z-10" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-semibold text-white">Scanning Bitstream...</div>
              <div className="text-xs text-orange-500 font-mono">78%</div>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div animate={{ width: ['0%', '78%'] }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full relative">
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>
          </div>
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
    <section id="features" className="py-32 bg-secondary/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="p-8 rounded-[2rem] bg-card border border-border hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <f.icon className="w-7 h-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechnologySection() {
    return (
        <section id="technology" className="py-32 bg-background">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
                <div>
                    <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
                        The <span className="gradient-text">7-Layer</span> Engine
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                        Our proprietary engine peels back digital layers to reveal inconsistencies. 
                        While AI generators are getting better at fooling human eyes, they cannot hide the mathematical fingerprints they leave behind.
                    </p>
                </div>
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-500 blur-[100px] opacity-20" />
                    <div className="relative rounded-3xl bg-[#0f0f0f] border border-white/10 p-8 shadow-2xl glass-card">
                        <div className="space-y-8">
                            {[98, 85, 92, 99].map((val, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm text-gray-400 mb-2 font-medium">
                                        <span>Layer {i + 1} Analysis</span>
                                        <span className="text-white">{val}%</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${val}%` }}
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                            className="h-full bg-gradient-to-r from-orange-500 to-pink-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-background pb-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <button onClick={onBack} className="mb-8 text-sm font-medium text-muted-foreground hover:text-orange-500 transition-colors flex items-center gap-2">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to Home
        </button>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Forensic Lab</h1>
          <p className="text-muted-foreground">Upload media to begin the 7-layer extraction process</p>
        </div>
        <UploadZone />
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-foreground">SatyaLens</span>
        </div>
        <div className="flex gap-6">
             {/* Social icons can go here */}
        </div>
        <p className="text-sm text-muted-foreground">© 2025 SatyaLens. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default App;