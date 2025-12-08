"use client";

import { useState, useRef, useEffect, useMemo, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import { appConfig } from '@/config/app.config';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import { ParticleBackground } from "@/components/shared/effects/particle-background";

// Lazy load 3D element for performance
const Hero3DElement = lazy(() => import("@/components/shared/effects/hero-3d-element").then(mod => ({ default: mod.Hero3DElement })));

// Animated gradient orb component with enhanced effects
function GradientOrb({ className, delay = 0, intensity = 1 }: { className: string; delay?: number; intensity?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-[100px] pointer-events-none ${className}`}
      animate={{
        opacity: [0.4 * intensity, 0.7 * intensity, 0.4 * intensity],
        scale: [1, 1.15, 1],
        rotate: [0, 10, 0],
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

// Floating particles background - uses seeded positions to avoid hydration mismatch
function FloatingParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fixed particle positions to avoid hydration mismatch
  const particles = useMemo(() => [
    { id: 0, x: 10, y: 20, size: 4, duration: 25, delay: 0 },
    { id: 1, x: 25, y: 45, size: 3, duration: 30, delay: 1 },
    { id: 2, x: 45, y: 15, size: 5, duration: 22, delay: 2 },
    { id: 3, x: 65, y: 35, size: 3.5, duration: 28, delay: 0.5 },
    { id: 4, x: 80, y: 55, size: 4, duration: 26, delay: 1.5 },
    { id: 5, x: 15, y: 70, size: 3, duration: 32, delay: 3 },
    { id: 6, x: 35, y: 85, size: 4.5, duration: 24, delay: 2.5 },
    { id: 7, x: 55, y: 60, size: 3, duration: 27, delay: 4 },
    { id: 8, x: 75, y: 25, size: 5, duration: 29, delay: 1 },
    { id: 9, x: 90, y: 75, size: 4, duration: 23, delay: 3.5 },
    { id: 10, x: 5, y: 50, size: 3.5, duration: 31, delay: 2 },
    { id: 11, x: 50, y: 90, size: 4, duration: 25, delay: 4.5 },
    { id: 12, x: 70, y: 10, size: 3, duration: 28, delay: 0 },
    { id: 13, x: 30, y: 65, size: 5, duration: 26, delay: 1 },
    { id: 14, x: 85, y: 40, size: 4, duration: 30, delay: 2 },
  ], []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-orange-500/20 dark:bg-orange-400/10"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 10, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Animated sparkle effect
function Sparkle({ delay = 0 }: { delay?: number }) {
  return (
    <motion.svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      className="absolute text-orange-400"
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0.5, 1, 0.5],
        rotate: [0, 180],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <path
        d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"
        fill="currentColor"
      />
    </motion.svg>
  );
}

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

  return (
    <div className="min-h-screen overflow-hidden relative flex flex-col">
      {/* Base gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 dark:from-gray-950 dark:via-slate-900 dark:to-gray-900" />
      
      {/* Animated aurora gradient overlay */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(251, 146, 60, 0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(147, 51, 234, 0.12) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 0% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse 80% 50% at 60% 10%, rgba(251, 146, 60, 0.18) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 90% 90%, rgba(147, 51, 234, 0.15) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 10% 60%, rgba(59, 130, 246, 0.12) 0%, transparent 50%)',
            'radial-gradient(ellipse 80% 50% at 40% 5%, rgba(251, 146, 60, 0.15) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 95% 95%, rgba(147, 51, 234, 0.12) 0%, transparent 50%), radial-gradient(ellipse 50% 30% at 5% 45%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Particle background with stars effect */}
      <ParticleBackground variant="stars" opacity={0.5} />
      
      {/* Animated Gradient Orbs - More vibrant */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Primary orange glow - top left */}
        <GradientOrb
          className="top-[-20%] left-[-10%] w-[800px] h-[800px] bg-gradient-to-br from-orange-400 via-amber-300 to-yellow-200 dark:from-orange-600/60 dark:via-amber-500/40 dark:to-yellow-400/30"
          delay={0}
          intensity={1}
        />
        
        {/* Purple glow - center right */}
        <GradientOrb
          className="top-[20%] right-[-15%] w-[700px] h-[700px] bg-gradient-to-bl from-purple-400 via-violet-300 to-fuchsia-200 dark:from-purple-600/50 dark:via-violet-500/40 dark:to-fuchsia-400/30"
          delay={2}
          intensity={0.9}
        />
        
        {/* Blue glow - bottom left */}
        <GradientOrb
          className="bottom-[-15%] left-[20%] w-[600px] h-[600px] bg-gradient-to-tr from-blue-400 via-cyan-300 to-teal-200 dark:from-blue-600/50 dark:via-cyan-500/40 dark:to-teal-400/30"
          delay={4}
          intensity={0.8}
        />
        
        {/* Pink glow - bottom right */}
        <GradientOrb
          className="bottom-[10%] right-[5%] w-[500px] h-[500px] bg-gradient-to-tl from-pink-400 via-rose-300 to-red-200 dark:from-pink-600/40 dark:via-rose-500/30 dark:to-red-400/20"
          delay={6}
          intensity={0.7}
        />
        
        {/* Center accent glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full blur-[150px] bg-gradient-to-r from-orange-200/30 via-purple-200/20 to-blue-200/30 dark:from-orange-500/15 dark:via-purple-500/10 dark:to-blue-500/15"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating particles */}
        <FloatingParticles />
        
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '48px 48px'
          }}
        />
        
        {/* Gradient line accents */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-orange-400/25 to-transparent dark:via-orange-500/15" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-400/20 to-transparent dark:via-purple-500/15" />
        <div className="absolute top-0 left-2/3 w-px h-full bg-gradient-to-b from-transparent via-blue-400/15 to-transparent dark:via-blue-500/10" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-orange-300/20 to-transparent dark:via-orange-500/10" />
      </div>

      {/* Enhanced Header with glassmorphism */}
      <motion.header
        className="relative z-10 px-8 py-8 lg:px-16 lg:py-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-6">
          {/* Logo/Brand with enhanced animation */}
          <motion.div
            className="flex items-center gap-3 group"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <div className="relative">
              {/* Glow effect behind logo */}
              <motion.div
                className="absolute inset-0 rounded-xl bg-orange-500/30 blur-xl"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Open Lovable
              </span>
              <motion.div
                className="text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                AI Website Builder
              </motion.div>
            </div>
          </motion.div>
          
          {/* Enhanced GitHub Link with glass effect */}
          <motion.a
            href="https://github.com/mendableai/open-lovable"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-full border border-gray-200/60 dark:border-gray-700/60 transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-900/50 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-white/80 dark:hover:bg-gray-800/80"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="group-hover:rotate-12 transition-transform duration-300">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="hidden sm:inline">Star on GitHub</span>
            <motion.span
              className="hidden sm:inline-flex items-center justify-center w-5 h-5 ml-1 text-[10px] font-semibold bg-gray-100 dark:bg-gray-700 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              ⭐
            </motion.span>
          </motion.a>
          
          {/* Command palette hint */}
          <motion.div
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100/60 dark:bg-gray-800/60 rounded-lg border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <span>Quick actions</span>
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded text-[10px] font-mono shadow-sm">⌘K</kbd>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 lg:pt-40 pb-16 lg:pb-28">
        <div className="container px-8 lg:px-24">
          {/* Badge with enhanced styling */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="flex justify-center mb-14"
          >
            <div className="group relative inline-flex items-center gap-3 px-6 py-2.5 bg-gradient-to-r from-orange-100/90 to-amber-100/90 dark:from-orange-900/40 dark:to-amber-900/40 rounded-full border border-orange-200/60 dark:border-orange-800/60 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 cursor-default">
              {/* Shimmer effect */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                />
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-br from-orange-400 to-orange-600" />
              </span>
              <span className="relative text-xs font-semibold text-orange-700 dark:text-orange-300 tracking-wide">
                Free & Open Source
              </span>
              <span className="relative text-orange-500/60 dark:text-orange-400/60">•</span>
              <span className="relative text-xs font-medium text-orange-600/80 dark:text-orange-400/80">
                v3.0
              </span>
            </div>
          </motion.div>

          {/* Main Headline with enhanced typography */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="text-center mb-20"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-10 tracking-tight leading-[1.08]">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                What do you want to
              </motion.span>{" "}
              <span className="relative inline-block">
                <motion.span
                  className="relative z-10 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  build
                </motion.span>
                {/* Animated underline */}
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.6, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
                {/* Glow effect */}
                <motion.span
                  className="absolute -bottom-3 left-0 right-0 h-4 bg-gradient-to-r from-orange-500/25 via-red-500/25 to-pink-500/25 blur-xl"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
                {/* Sparkles */}
                <div className="absolute -top-2 -right-4 hidden sm:block">
                  <Sparkle delay={0} />
                </div>
                <div className="absolute -bottom-4 -left-2 hidden sm:block">
                  <Sparkle delay={1} />
                </div>
              </span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                ?
              </motion.span>
            </h1>
            <motion.p
              className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              Describe your vision in plain English.{" "}
              <span className="text-gray-900 dark:text-white font-semibold">AI generates production-ready code</span>{" "}
              in seconds.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Main Input Section */}
      <div className="relative z-10 container px-8 lg:px-24 mb-28 lg:mb-40">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {/* Floating glow effect */}
          <motion.div
            className="absolute -inset-6 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 rounded-[40px] blur-3xl"
            animate={{ opacity: isFocused ? 0.8 : 0.3 }}
            transition={{ duration: 0.3 }}
          />
          
          <motion.div
            className={`relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl lg:rounded-[2rem] transition-all duration-300 border ${
              isFocused
                ? 'border-orange-300 dark:border-orange-700 shadow-2xl shadow-orange-500/20'
                : 'border-gray-200/50 dark:border-gray-700/50 shadow-xl'
            }`}
            animate={{ y: isFocused ? -4 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            {/* Input Area */}
            <div className="p-8 lg:p-10">
              <div className="flex gap-6 items-start">
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
                    className="w-full bg-transparent text-lg lg:text-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none resize-none min-h-[80px] max-h-[220px] leading-relaxed"
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
            <div className="px-8 lg:px-10 py-6 flex items-center justify-between gap-6">
              {/* Left side */}
              <div className="flex items-center gap-4">
                {/* Model Dropdown */}
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200/80 dark:hover:bg-gray-600/80 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer transition-all"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Hint text */}
                <span className="hidden lg:inline text-sm text-gray-400 dark:text-gray-500">
                  Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-xs font-mono">Enter</kbd> to generate
                </span>
              </div>

              {/* Submit button */}
              <motion.button
                onClick={handleSubmit}
                disabled={!prompt.trim() || isNavigating}
                className={`
                  relative px-8 py-3.5 rounded-xl font-semibold text-base
                  flex items-center gap-3 transition-all duration-200 overflow-hidden
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


      {/* Features Section */}
      <section className="relative z-10 py-28 lg:py-40 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/30 flex-grow">
        <div className="container px-8 lg:px-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="max-w-7xl mx-auto"
          >
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="text-center text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-8"
            >
              Everything you need to build fast
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="text-center text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-20 max-w-3xl mx-auto leading-relaxed"
            >
              From idea to deployed website in minutes, not days
            </motion.p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {/* Feature 1 */}
              <motion.div
                className="group text-center p-10 lg:p-12 rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </motion.div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Lightning Fast</h3>
                <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                  Generate complete websites in seconds, not hours. Describe your vision and watch the magic happen.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                className="group text-center p-10 lg:p-12 rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </motion.div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Clone Any Site</h3>
                <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                  Paste a URL in the chat and AI will analyze and recreate the design for you instantly.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                className="group text-center p-10 lg:p-12 rounded-3xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </motion.div>
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-4 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Export & Deploy</h3>
                <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                  Download as ZIP or deploy directly. Production-ready React code at your fingertips.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Sticks to bottom */}
      <footer className="relative z-10 mt-auto py-8 border-t border-gray-200/30 dark:border-gray-800/30 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm">
        <div className="container px-8 lg:px-24">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-medium">Open Lovable</span>
            </div>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
            <a
              href="https://github.com/mendableai/open-lovable"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-500 transition-colors flex items-center gap-1"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Star on GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}