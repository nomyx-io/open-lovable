"use client";

import { motion } from "framer-motion";
import { examplePrompts, type ExamplePrompt } from "../data";
import { ChevronRightIcon } from "./icons";

interface ExamplePromptsProps {
  onExampleClick: (prompt: string) => void;
}

export function ExamplePrompts({ onExampleClick }: ExamplePromptsProps) {
  return (
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
              <ExamplePromptCard
                key={example.title}
                example={example}
                index={index}
                onClick={() => onExampleClick(example.prompt)}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface ExamplePromptCardProps {
  example: ExamplePrompt;
  index: number;
  onClick: () => void;
}

function ExamplePromptCard({ example, index, onClick }: ExamplePromptCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
      onClick={onClick}
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
        <ChevronRightIcon className="w-4 h-4 text-gray-500" />
      </motion.div>
    </motion.button>
  );
}