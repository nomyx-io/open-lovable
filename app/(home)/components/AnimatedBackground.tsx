"use client";

import { motion } from "framer-motion";

interface GradientOrbProps {
  className: string;
  delay?: number;
}

export function GradientOrb({ className, delay = 0 }: GradientOrbProps) {
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

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <GradientOrb 
        className="top-[-10%] left-[10%] w-[500px] h-[500px] bg-orange-300/40 dark:bg-orange-900/30" 
        delay={0} 
      />
      <GradientOrb 
        className="bottom-[10%] right-[5%] w-[400px] h-[400px] bg-blue-300/30 dark:bg-blue-900/20" 
        delay={2} 
      />
      <GradientOrb 
        className="top-[40%] left-[60%] w-[600px] h-[600px] bg-purple-200/20 dark:bg-purple-900/10" 
        delay={4} 
      />
      
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />
    </div>
  );
}