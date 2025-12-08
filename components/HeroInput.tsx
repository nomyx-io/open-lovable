"use client";

import { useState, KeyboardEvent, useEffect, useRef, RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScreenshotButton, type ScreenshotAttachment } from "./shared/ScreenshotButton";

interface HeroInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  className?: string;
  showSearchFeatures?: boolean;
  disabled?: boolean;
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  onScreenshotCapture?: (screenshot: ScreenshotAttachment) => void;
  pendingScreenshot?: ScreenshotAttachment | null;
  onRemoveScreenshot?: () => void;
  showScreenshotButton?: boolean;
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
  disabled = false,
  iframeRef,
  onScreenshotCapture,
  pendingScreenshot,
  onRemoveScreenshot,
  showScreenshotButton = true
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
    <div
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main container - simplified styling */}
      <div
        className={`
          bg-white dark:bg-gray-900 rounded-2xl border transition-all duration-200
          ${isFocused
            ? 'border-orange-400 dark:border-orange-500/60 shadow-md'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 shadow-sm'}
          ${disabled ? 'opacity-60 pointer-events-none' : ''}
        `}
      >
        {/* Input area */}
        <div className="relative">
          <label className="flex gap-3 items-start p-4 cursor-text">
            {/* Simple icon - no animations */}
            <div className="mt-0.5 flex-shrink-0">
              {showSearchFeatures ? (
                isURLInput ? (
                  <div className="w-5 h-5 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-green-600 dark:text-green-400">
                      <path d="M6.5 11.5L4 14C3.5 14.5 2 15 2 13.5C2 12 3.5 11 4.5 11.5L6.5 11.5M6.5 11.5L9.5 4.5M9.5 4.5L12 2C12.5 1.5 14 1 14 2.5C14 4 12.5 5 11.5 4.5L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ) : (
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${hasValue ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={hasValue ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}>
                      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                )
              ) : (
                <div className={`w-5 h-5 rounded-md flex items-center justify-center ${hasValue ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className={hasValue ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'}>
                    <path d="M8 2L8 14M2 8H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              )}
            </div>

            <textarea
              ref={textareaRef}
              className="
                flex-1 bg-transparent text-gray-900 dark:text-gray-100 text-sm leading-relaxed
                placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none outline-none
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
        </div>

        {/* Simple divider */}
        <div className="mx-4 h-px bg-gray-100 dark:bg-gray-800" />

        {/* Action bar - simplified */}
        <div className="p-3 flex items-center justify-between gap-3">
          {/* Left side: Screenshot button and URL detection */}
          <div className="flex items-center gap-2">
            {/* Screenshot Button */}
            {showScreenshotButton && !showSearchFeatures && (
              <ScreenshotButton
                iframeRef={iframeRef}
                onScreenshotCapture={onScreenshotCapture}
                pendingScreenshot={pendingScreenshot}
                onRemoveScreenshot={onRemoveScreenshot}
                compact
              />
            )}
            
            {/* Pending Screenshot Preview (for when not showing button) */}
            {pendingScreenshot && showSearchFeatures && (
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <div className="relative w-12 h-9 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                    <img
                      src={pendingScreenshot.dataUrl}
                      alt="Screenshot"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={onRemoveScreenshot}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-white">
                        <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                    <svg width="6" height="6" viewBox="0 0 12 12" fill="none" className="text-white">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            )}
            
            {/* URL detection badge */}
            {isURLInput && showSearchFeatures && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200/50 dark:border-green-800/50">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <span className="text-[11px] font-medium text-green-700 dark:text-green-400">URL detected</span>
              </div>
            )}
          </div>

          {/* Submit button - simplified, no shimmer or pulse */}
          <button
            onClick={handleSubmit}
            disabled={!hasValue || disabled}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl
              text-sm font-semibold transition-all duration-150
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 dark:focus:ring-offset-gray-900
              ${hasValue && !disabled
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm hover:shadow-md hover:from-orange-600 hover:to-orange-700 active:scale-[0.98]'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }
            `}
          >
            <span>
              {showSearchFeatures
                ? (isURLInput ? 'Clone' : 'Send')
                : 'Send'
              }
            </span>
            
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M3 8H13M9 4L13 8L9 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}