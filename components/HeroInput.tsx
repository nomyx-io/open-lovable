"use client";

import { useState, KeyboardEvent, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface HeroInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
  showSearchFeatures?: boolean;
  disabled?: boolean;
}

function isURL(str: string): boolean {
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
  return urlPattern.test(str.trim());
}

export default function HeroInput({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder = "Describe what you want to build...",
  className = "",
  showSearchFeatures = true,
  disabled = false
}: HeroInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isURLInput = showSearchFeatures ? isURL(value) : false;
  const hasValue = value.trim().length > 0;

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && hasValue) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (!disabled && hasValue) {
      onSubmit();
    }
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main container with enhanced styling */}
      <motion.div
        initial={false}
        animate={{
          boxShadow: isFocused 
            ? '0 0 0 3px rgba(249, 115, 22, 0.15), 0 4px 20px rgba(0, 0, 0, 0.08)' 
            : isHovered 
              ? '0 4px 16px rgba(0, 0, 0, 0.06)' 
              : '0 2px 8px rgba(0, 0, 0, 0.04)',
          scale: isFocused ? 1.01 : 1
        }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={`
          bg-white rounded-2xl border transition-colors duration-200
          ${isFocused ? 'border-orange-300' : 'border-gray-200 hover:border-gray-300'}
          ${disabled ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        {/* Input area */}
        <div className="relative">
          <label className="flex gap-3 items-start p-4 cursor-text">
            {/* Icon with animation */}
            <motion.div 
              className="mt-1 flex-shrink-0"
              animate={{ 
                scale: isFocused ? 1.1 : 1,
                rotate: isURLInput && isFocused ? [0, -10, 10, 0] : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence mode="wait">
                {showSearchFeatures ? (
                  isURLInput ? (
                    <motion.div
                      key="url"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="w-5 h-5 rounded-md bg-green-100 flex items-center justify-center"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-green-600">
                        <path d="M6.5 11.5L4 14C3.5 14.5 2 15 2 13.5C2 12 3.5 11 4.5 11.5L6.5 11.5M6.5 11.5L9.5 4.5M9.5 4.5L12 2C12.5 1.5 14 1 14 2.5C14 4 12.5 5 11.5 4.5L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`w-5 h-5 rounded-md flex items-center justify-center ${hasValue ? 'bg-orange-100' : 'bg-gray-100'}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={hasValue ? 'text-orange-600' : 'text-gray-500'}>
                        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </motion.div>
                  )
                ) : (
                  <motion.div
                    key="default"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`w-5 h-5 rounded-md flex items-center justify-center ${hasValue ? 'bg-orange-100' : 'bg-gray-100'}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={hasValue ? 'text-orange-600' : 'text-gray-500'}>
                      <path d="M8 2L8 14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <textarea
              ref={textareaRef}
              className="
                flex-1 bg-transparent text-gray-900 text-sm leading-relaxed
                placeholder:text-gray-400 resize-none outline-none
                min-h-[24px] max-h-[200px]
              "
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              rows={1}
              disabled={disabled}
            />
          </label>

          {/* Character count indicator (subtle) */}
          <AnimatePresence>
            {value.length > 50 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-4 top-4 text-[10px] text-gray-400"
              >
                {value.length}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider with animation */}
        <motion.div 
          className="mx-4 h-px bg-gray-100"
          animate={{ scaleX: isFocused ? 1 : 0.95, opacity: isFocused ? 1 : 0.5 }}
          transition={{ duration: 0.2 }}
        />

        {/* Action bar */}
        <div className="p-3 flex items-center justify-between gap-3">
          {/* Tips or hints */}
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait">
              {isURLInput && showSearchFeatures && (
                <motion.div
                  key="url-hint"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-md"
                >
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  <span className="text-[11px] font-medium text-green-700">URL detected</span>
                </motion.div>
              )}
              {!isURLInput && hasValue && (
                <motion.div
                  key="text-hint"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-[11px] text-gray-400"
                >
                  Press Enter to submit
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!hasValue || disabled}
            whileHover={hasValue && !disabled ? { scale: 1.02 } : {}}
            whileTap={hasValue && !disabled ? { scale: 0.98 } : {}}
            className={`
              relative flex items-center gap-2 px-4 py-2 rounded-xl
              text-sm font-medium transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400
              ${hasValue && !disabled
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {/* Button background glow effect */}
            {hasValue && !disabled && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 opacity-0"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            
            <span className="relative">
              {showSearchFeatures 
                ? (isURLInput ? 'Clone Site' : 'Search')
                : 'Send'
              }
            </span>
            
            <motion.svg 
              width="14" 
              height="14" 
              viewBox="0 0 16 16" 
              fill="none"
              className="relative"
              animate={{ x: hasValue ? [0, 3, 0] : 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <path 
                d="M3 8H13M9 4L13 8L9 12" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </motion.svg>
          </motion.button>
        </div>
      </motion.div>

      {/* Keyboard shortcut hints */}
      <AnimatePresence>
        {isFocused && hasValue && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -bottom-7 left-0 right-0 flex justify-center"
          >
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">↵</kbd>
                <span>Submit</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200 font-mono">⇧↵</kbd>
                <span>New line</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}