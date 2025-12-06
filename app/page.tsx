"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { appConfig } from '@/config/app.config';
import { motion, AnimatePresence } from "framer-motion";

// Animated gradient orb component
function GradientOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
}

// Example prompts for inspiration
const examplePrompts = [
  {
    icon: "🛍️",
    title: "E-commerce store",
    prompt: "Build a modern e-commerce landing page with a hero section, featured products grid, testimonials, and a newsletter signup"
  },
  {
    icon: "📊",
    title: "SaaS dashboard",
    prompt: "Create a SaaS dashboard with sidebar navigation, analytics cards, charts, and a data table"
  },
  {
    icon: "📝",
    title: "Blog platform",
    prompt: "Design a minimalist blog with a featured post hero, article grid, category filters, and dark mode"
  },
  {
    icon: "🎨",
    title: "Portfolio site",
    prompt: "Build a creative portfolio with an animated hero, project gallery, about section, and contact form"
  },
  {
    icon: "🏢",
    title: "Company website",
    prompt: "Create a professional company website with team section, services, case studies, and contact page"
  },
  {
    icon: "📱",
    title: "Mobile app landing",
    prompt: "Design an app landing page with phone mockups, feature highlights, pricing table, and download buttons"
  }
];

export default function HomePage() {
  const [prompt, setPrompt] = useState<string>("");
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>(appConfig.ai.defaultModel);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [prompt]);

  const models = appConfig.ai.availableModels.map(model => ({
    id: model,
    name: appConfig.ai.modelDisplayNames[model] || model,
  }));

  const handleSubmit = async () => {
    const inputValue = prompt.trim();
    if (!inputValue || isNavigating) return;

    setIsNavigating(true);
    
    // Store the prompt and settings in session storage
    sessionStorage.setItem('initialPrompt', inputValue);
    sessionStorage.setItem('selectedModel', selectedModel);
    sessionStorage.setItem('autoStartChat', 'true');
    
    // Navigate to generation page
    router.push('/generation');
  };

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <GradientOrb className="top-[-10%] left-[10%] w-[500px] h-[500px] bg-orange-300/40 dark:bg-orange-900/30" delay={0} />
        <GradientOrb className="bottom-[10%] right-[5%] w-[400px] h-[400px] bg-blue-300/30 dark:bg-blue-900/20" delay={2} />
        <GradientOrb className="top-[40%] left-[60%] w-[600px] h-[600px] bg-purple-200/20 dark:bg-purple-900/10" delay={4} />
        
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Enhanced Header */}
      <motion.header
        className="relative z-10 px-4 py-4 lg:px-8 lg:py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo/Brand with animation */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Open Lovable
              </span>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase">
                AI Website Builder
              </div>
            </div>
          </motion.div>
          
          {/* Enhanced GitHub Link */}
          <motion.a
            href="https://github.com/mendableai/open-lovable"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 transition-all hover:shadow-lg hover:border-gray-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="hidden sm:inline">Star on GitHub</span>
          </motion.a>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 pt-8 lg:pt-16 pb-6 lg:pb-12">
        <div className="container px-4 lg:px-16">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100/80 dark:bg-orange-900/30 rounded-full border border-orange-200/50 dark:border-orange-800/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
              </span>
              <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                Free & Open Source
              </span>
            </div>
          </motion.div>

          {/* Main Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-center mb-10"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight leading-[1.1]">
              What do you want to{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
                  build
                </span>
                <motion.span
                  className="absolute -bottom-2 left-0 right-0 h-3 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 blur-lg"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </span>
              ?
            </h1>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Describe your vision in plain English.{" "}
              <span className="text-gray-900 dark:text-white font-medium">AI generates production-ready code</span>{" "}
              in seconds.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Input Section */}
      <div className="relative z-10 container px-4 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto"
        >
          {/* Floating glow effect */}
          <motion.div
            className="absolute -inset-4 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 rounded-[32px] blur-2xl"
            animate={{ opacity: isFocused ? 0.8 : 0.3 }}
            transition={{ duration: 0.3 }}
          />
          
          <motion.div
            className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl lg:rounded-3xl transition-all duration-300 border ${
              isFocused
                ? 'border-orange-300 dark:border-orange-700 shadow-2xl shadow-orange-500/20'
                : 'border-gray-200/50 dark:border-gray-700/50 shadow-xl'
            }`}
            animate={{ y: isFocused ? -4 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Input Area */}
            <div className="p-5 lg:p-7">
              <div className="flex gap-4 items-start">
                {/* Animated Sparkle Icon */}
                <motion.div
                  className={`flex-shrink-0 mt-0.5 transition-colors duration-300 ${isFocused ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}`}
                  animate={isFocused ? { rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.div>
                
                {/* Textarea */}
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    className="w-full bg-transparent text-base lg:text-lg text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none resize-none min-h-[70px] max-h-[200px] leading-relaxed"
                    placeholder="A landing page for a fitness app with pricing, testimonials, and a hero section..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    rows={2}
                  />
                  
                  {/* Character count */}
                  <AnimatePresence>
                    {prompt.length > 50 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 bottom-0 text-xs text-gray-400"
                      >
                        {prompt.length} chars
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Gradient Divider */}
            <div className="relative h-px">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent" />
            </div>

            {/* Action Bar */}
            <div className="px-5 lg:px-7 py-4 flex items-center justify-between gap-4">
              {/* Left side */}
              <div className="flex items-center gap-3">
                {/* Model Dropdown */}
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer transition-all"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Hint text */}
                <span className="hidden lg:inline text-xs text-gray-400 dark:text-gray-500">
                  Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Enter</kbd> to generate
                </span>
              </div>

              {/* Submit button */}
              <motion.button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isNavigating}
                className={`
                  relative px-6 py-3 rounded-xl font-semibold text-sm
                  flex items-center gap-2 transition-all duration-200 overflow-hidden
                  ${prompt.trim() && !isNavigating
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }
                `}
                whileHover={prompt.trim() && !isNavigating ? { scale: 1.02 } : {}}
                whileTap={prompt.trim() && !isNavigating ? { scale: 0.98 } : {}}
              >
                {/* Animated background shimmer */}
                {prompt.trim() && !isNavigating && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
                  />
                )}
                
                {isNavigating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <span className="relative">Generate</span>
                    <motion.svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="relative"
                      animate={prompt.trim() ? { x: [0, 3, 0] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </motion.svg>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Example Prompts Section */}
      <section className="relative z-10 py-16 lg:py-24">
        <div className="container px-4 lg:px-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <motion.h2
              className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-8 lg:mb-10 uppercase tracking-wider"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Get inspired with these examples
            </motion.h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5 max-w-5xl mx-auto">
              {examplePrompts.map((example, index) => (
                <motion.button
                  key={example.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  onClick={() => handleExampleClick(example.prompt)}
                  className="group relative text-left p-5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 overflow-hidden"
                  whileHover={{ y: -4 }}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute -inset-px bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300" />
                  
                  <div className="relative flex items-start gap-4">
                    <motion.span
                      className="text-3xl flex-shrink-0"
                      whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      {example.icon}
                    </motion.span>
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-red-500 group-hover:bg-clip-text transition-all duration-300">
                        {example.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {example.prompt}
                      </div>
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <motion.div
                    className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    initial={{ x: 10, opacity: 0 }}
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-16 lg:py-24 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/30">
        <div className="container px-4 lg:px-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="max-w-5xl mx-auto"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="text-center text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4"
            >
              Everything you need to build fast
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
            >
              From idea to deployed website in minutes, not days
            </motion.p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
              {/* Feature 1 */}
              <motion.div
                className="group text-center p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </motion.div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Lightning Fast</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Generate complete websites in seconds, not hours. Describe your vision and watch the magic happen.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                className="group text-center p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </motion.div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Clone Any Site</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Paste a URL in the chat and AI will analyze and recreate the design for you instantly.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                className="group text-center p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </motion.div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Export & Deploy</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Download as ZIP or deploy directly. Production-ready React code at your fingertips.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
        <div className="container px-4 lg:px-16">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Open source AI website builder
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <span>Built with Next.js, React & AI</span>
              <a
                href="https://github.com/mendableai/open-lovable"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-orange-500 transition-colors flex items-center gap-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}