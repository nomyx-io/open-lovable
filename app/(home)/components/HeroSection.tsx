"use client";

import { motion } from "framer-motion";

export function HeroSection() {
  return (
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
  );
}