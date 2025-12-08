"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// Progress step component
function ProgressStep({ step, currentStep, label }: { step: number; currentStep: number; label: string }) {
  const isActive = step <= currentStep;
  const isCurrent = step === currentStep;
  
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: step * 0.1 }}
    >
      <motion.div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
        }`}
        animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: isCurrent ? Infinity : 0 }}
      >
        {isActive && step < currentStep ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12L10 17L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          step
        )}
      </motion.div>
      <span className={`text-sm font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
        {label}
      </span>
    </motion.div>
  );
}

export default function BuilderPage() {
  const [targetUrl, setTargetUrl] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("modern");
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [progress, setProgress] = useState<string>("Initializing...");
  const [progressStep, setProgressStep] = useState<number>(1);
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    // Get the URL and style from sessionStorage
    const url = sessionStorage.getItem('targetUrl');
    const style = sessionStorage.getItem('selectedStyle');
    
    if (!url) {
      router.push('/');
      return;
    }
    
    setTargetUrl(url);
    setSelectedStyle(style || "modern");
    
    // Start the website generation process
    generateWebsite(url, style || "modern");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const generateWebsite = async (url: string, style: string) => {
    try {
      setProgress("Analyzing website...");
      setProgressStep(1);
      await new Promise(r => setTimeout(r, 800));
      
      setProgress("Extracting content...");
      setProgressStep(2);
      await new Promise(r => setTimeout(r, 600));
      
      setProgress("Generating design...");
      setProgressStep(3);
      await new Promise(r => setTimeout(r, 700));
      
      setProgress("Optimizing code...");
      setProgressStep(4);
      
      // For demo purposes, we'll generate a simple HTML template
      // In production, this would call the actual scraping and generation APIs
      const mockGeneratedCode = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${style} Website - Reimagined</title>
  <style>
    :root {
      --primary: ${style === 'modern' ? '#FA5D19' : style === 'playful' ? '#9061ff' : style === 'professional' ? '#2a6dfb' : '#eb3424'};
      --background: ${style === 'modern' ? '#ffffff' : style === 'playful' ? '#f9f9f9' : style === 'professional' ? '#f5f5f5' : '#fafafa'};
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--background);
      color: #262626;
      line-height: 1.6;
    }
    
    header {
      background: white;
      border-bottom: 1px solid #ededed;
      padding: 2rem;
    }
    
    nav {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--primary);
    }
    
    main {
      max-width: 1200px;
      margin: 4rem auto;
      padding: 0 2rem;
    }
    
    .hero {
      text-align: center;
      margin-bottom: 4rem;
    }
    
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--primary), #262626);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .subtitle {
      font-size: 1.25rem;
      color: #666;
    }
    
    .cta-button {
      display: inline-block;
      margin-top: 2rem;
      padding: 1rem 2rem;
      background: var(--primary);
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      transition: transform 0.2s;
    }
    
    .cta-button:hover {
      transform: scale(1.05);
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 4rem;
    }
    
    .feature {
      padding: 2rem;
      background: white;
      border-radius: 1rem;
      border: 1px solid #ededed;
      transition: box-shadow 0.2s;
    }
    
    .feature:hover {
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }
    
    .feature h3 {
      margin-bottom: 1rem;
      color: var(--primary);
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <div class="logo">Reimagined</div>
      <div>
        <a href="#features" style="margin-right: 2rem; color: #666; text-decoration: none;">Features</a>
        <a href="#about" style="margin-right: 2rem; color: #666; text-decoration: none;">About</a>
        <a href="#contact" style="color: #666; text-decoration: none;">Contact</a>
      </div>
    </nav>
  </header>
  
  <main>
    <div class="hero">
      <h1>Welcome to Your ${style === 'modern' ? 'Modern' : style === 'playful' ? 'Playful' : style === 'professional' ? 'Professional' : 'Artistic'} Website</h1>
      <p class="subtitle">Reimagined from ${url}</p>
      <a href="#" class="cta-button">Get Started</a>
    </div>
    
    <div class="features" id="features">
      <div class="feature">
        <h3>Fast</h3>
        <p>Lightning-fast performance optimized for modern web standards.</p>
      </div>
      <div class="feature">
        <h3>Responsive</h3>
        <p>Looks great on all devices, from mobile to desktop.</p>
      </div>
      <div class="feature">
        <h3>Beautiful</h3>
        <p>Stunning design that captures attention and drives engagement.</p>
      </div>
    </div>
  </main>
</body>
</html>`;
      
      setGeneratedCode(mockGeneratedCode);
      
      // Create a blob URL for the preview
      const blob = new Blob([mockGeneratedCode], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
      
      setProgress("Website ready!");
      setProgressStep(5);
      await new Promise(r => setTimeout(r, 300));
      setIsLoading(false);
      
      // Show success message
      toast.success("Website generated successfully!");
      
    } catch (error) {
      console.error("Error generating website:", error);
      toast.error("Failed to generate website. Please try again.");
      setProgress("Error occurred");
      setTimeout(() => router.push('/'), 2000);
    }
  };
  
  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'website.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Code downloaded!");
  };

  const progressSteps = [
    { step: 1, label: "Analyzing" },
    { step: 2, label: "Extracting" },
    { step: 3, label: "Designing" },
    { step: 4, label: "Optimizing" },
    { step: 5, label: "Complete" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
      </div>

      <div className="flex h-screen relative">
        {/* Sidebar */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-96 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-700/50 p-8 flex flex-col shadow-2xl shadow-black/5"
        >
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-2"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Website Builder</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered generation</p>
              </div>
            </motion.div>
          </div>

          {/* Progress Steps */}
          <div className="mb-8 space-y-4">
            {progressSteps.map((item) => (
              <ProgressStep
                key={item.step}
                step={item.step}
                currentStep={progressStep}
                label={item.label}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-8" />
          
          {/* Details Cards */}
          <div className="space-y-4 flex-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Target URL</span>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{targetUrl}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gray-400">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Style</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium ${
                  selectedStyle === 'modern' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  selectedStyle === 'playful' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                  selectedStyle === 'professional' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)}
                </span>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-100 dark:border-orange-800/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="relative">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  {isLoading && <div className="absolute inset-0 w-2 h-2 bg-orange-400 rounded-full animate-ping" />}
                </div>
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide">Status</span>
              </div>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">{progress}</p>
            </motion.div>
          </div>
          
          {/* Action Buttons */}
          <div className="space-y-3 pt-6">
            <AnimatePresence>
              {!isLoading && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={downloadCode}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7 10 12 15 17 10" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/>
                  </svg>
                  Download Code
                </motion.button>
              )}
            </AnimatePresence>
            
            <motion.button
              onClick={() => router.push('/')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Start Over
            </motion.button>
          </div>
        </motion.div>
        
        {/* Preview Area */}
        <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full h-full rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xl shadow-black/10 border border-gray-200/50 dark:border-gray-700/50"
          >
            {/* Browser Chrome */}
            <div className="h-12 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="w-96 h-7 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center px-3 text-xs text-gray-400">
                  {isLoading ? 'Building your website...' : previewUrl ? 'localhost:3000' : ''}
                </div>
              </div>
              <div className="w-16" /> {/* Spacer for symmetry */}
            </div>

            {/* Content Area */}
            <div className="h-[calc(100%-48px)]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    {/* Animated loader */}
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-orange-200 dark:border-orange-800"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500"
                          animate={{ scale: [1, 0.9, 1], rotate: [0, 180, 360] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </div>
                    <motion.p
                      className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {progress}
                    </motion.p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      This may take a few moments
                    </p>
                  </motion.div>
                </div>
              ) : (
                previewUrl && (
                  <motion.iframe
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="Website Preview"
                  />
                )
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}