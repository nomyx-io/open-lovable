"use client";

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { appConfig } from '@/config/app.config';
import { SparkleIcon, ArrowRightIcon, ChevronDownIcon } from "./icons";

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  isFocused: boolean;
  setIsFocused: (focused: boolean) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isNavigating: boolean;
  onSubmit: () => void;
}

export function PromptInput({
  prompt,
  setPrompt,
  isFocused,
  setIsFocused,
  selectedModel,
  setSelectedModel,
  isNavigating,
  onSubmit,
}: PromptInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  return (
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
                <SparkleIcon className="w-6 h-6" />
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
                      onSubmit();
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
                <ChevronDownIcon className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>

              {/* Hint text */}
              <span className="hidden lg:inline text-xs text-gray-400 dark:text-gray-500">
                Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-[10px] font-mono">Enter</kbd> to generate
              </span>
            </div>

            {/* Submit button */}
            <SubmitButton
              prompt={prompt}
              isNavigating={isNavigating}
              onSubmit={onSubmit}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

interface SubmitButtonProps {
  prompt: string;
  isNavigating: boolean;
  onSubmit: () => void;
}

function SubmitButton({ prompt, isNavigating, onSubmit }: SubmitButtonProps) {
  const isDisabled = !prompt.trim() || isNavigating;
  
  return (
    <motion.button
      onClick={onSubmit}
      disabled={isDisabled}
      className={`
        relative px-6 py-3 rounded-xl font-semibold text-sm
        flex items-center gap-2 transition-all duration-200 overflow-hidden
        ${!isDisabled
          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }
      `}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
    >
      {/* Animated background shimmer */}
      {!isDisabled && (
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
          <motion.div
            className="relative"
            animate={prompt.trim() ? { x: [0, 3, 0] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ArrowRightIcon className="w-4 h-4" />
          </motion.div>
        </>
      )}
    </motion.button>
  );
}