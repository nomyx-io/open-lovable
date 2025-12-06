"use client";

import { motion } from "framer-motion";
import { LogoIcon, GitHubIcon } from "./icons";

export function Header() {
  return (
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
              <LogoIcon className="w-5 h-5 text-white" />
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
          <GitHubIcon className="w-[18px] h-[18px]" />
          <span className="hidden sm:inline">Star on GitHub</span>
        </motion.a>
      </div>
    </motion.header>
  );
}