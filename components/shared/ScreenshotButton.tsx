'use client';

import { useState, useCallback, useEffect, RefObject } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

export interface ScreenshotAttachment {
  dataUrl: string;
  width: number;
  height: number;
  timestamp: Date;
}

interface ScreenshotButtonProps {
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  onScreenshotCapture?: (screenshot: ScreenshotAttachment) => void;
  pendingScreenshot?: ScreenshotAttachment | null;
  onRemoveScreenshot?: () => void;
  className?: string;
  compact?: boolean;
}

/**
 * Screenshot button component for capturing app preview
 * Nicely placed UI element with tooltip and visual feedback
 */
export function ScreenshotButton({
  iframeRef,
  onScreenshotCapture,
  pendingScreenshot,
  onRemoveScreenshot,
  className = '',
  compact = false
}: ScreenshotButtonProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureScreenshot = useCallback(async () => {
    if (isCapturing) return;
    
    setIsCapturing(true);
    setError(null);

    try {
      let canvas: HTMLCanvasElement;

      if (iframeRef?.current) {
        const iframe = iframeRef.current;
        const iframeRect = iframe.getBoundingClientRect();
        
        // Check if iframe has content
        if (iframeRect.width === 0 || iframeRect.height === 0) {
          throw new Error('Preview not available');
        }

        // Find the preview container (parent of iframe)
        const previewContainer = iframe.closest('[class*="preview"]') || iframe.parentElement;
        
        if (previewContainer && previewContainer instanceof HTMLElement) {
          canvas = await html2canvas(previewContainer, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            width: Math.min(previewContainer.offsetWidth, 1200),
            height: Math.min(previewContainer.offsetHeight, 800),
          });
        } else {
          // Fallback: capture the area where the iframe is
          canvas = await html2canvas(document.body, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            logging: false,
            x: iframeRect.left + window.scrollX,
            y: iframeRect.top + window.scrollY,
            width: Math.min(iframeRect.width, 1200),
            height: Math.min(iframeRect.height, 800),
          });
        }
      } else {
        // Capture the preview panel area if no iframe ref
        const previewPanel = document.querySelector('[class*="PreviewPanel"]') || 
                            document.querySelector('[class*="preview"]') ||
                            document.querySelector('main');
        
        if (previewPanel && previewPanel instanceof HTMLElement) {
          canvas = await html2canvas(previewPanel, {
            scale: 1,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
          });
        } else {
          throw new Error('No preview available to capture');
        }
      }

      const dataUrl = canvas.toDataURL('image/png', 0.9);
      
      const screenshot: ScreenshotAttachment = {
        dataUrl,
        width: canvas.width,
        height: canvas.height,
        timestamp: new Date(),
      };

      onScreenshotCapture?.(screenshot);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture screenshot';
      setError(errorMessage);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsCapturing(false);
    }
  }, [iframeRef, onScreenshotCapture, isCapturing]);

  // Listen for captureScreenshot event from command palette or keyboard shortcut
  useEffect(() => {
    const handleCaptureEvent = () => {
      if (!isCapturing) {
        captureScreenshot();
      }
    };

    window.addEventListener('captureScreenshot', handleCaptureEvent);
    return () => window.removeEventListener('captureScreenshot', handleCaptureEvent);
  }, [captureScreenshot, isCapturing]);

  // If there's a pending screenshot, show a thumbnail preview
  if (pendingScreenshot) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={`relative inline-flex items-center gap-2 ${className}`}
      >
        <div className="relative group">
          <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <img
              src={pendingScreenshot.dataUrl}
              alt="Screenshot preview"
              className="w-full h-full object-cover"
            />
            {/* Overlay with remove button */}
            <motion.button
              onClick={onRemoveScreenshot}
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove screenshot"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-white"
              >
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </motion.button>
          </div>
          {/* Badge indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
            <svg width="8" height="8" viewBox="0 0 12 12" fill="none" className="text-white">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Screenshot attached
        </span>
      </motion.div>
    );
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      <motion.button
        onClick={captureScreenshot}
        disabled={isCapturing}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          relative p-2 rounded-lg transition-all duration-200
          ${isCapturing
            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 cursor-wait'
            : error
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-800 dark:hover:text-gray-200'
          }
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 dark:focus:ring-offset-gray-900
        `}
        aria-label="Capture screenshot of preview"
        title="Capture screenshot (Cmd/Ctrl+Shift+S)"
      >
        <AnimatePresence mode="wait">
          {isCapturing ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ rotate: { duration: 1, repeat: Infinity, ease: 'linear' } }}
            >
              <svg
                width={compact ? "16" : "18"}
                height={compact ? "16" : "18"}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2C6.48 2 2 6.48 2 12" strokeLinecap="round" />
              </svg>
            </motion.div>
          ) : (
            <motion.div
              key="camera"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <svg
                width={compact ? "16" : "18"}
                height={compact ? "16" : "18"}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isCapturing && !error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-md whitespace-nowrap shadow-lg z-50"
          >
            Capture screenshot
            <span className="ml-1.5 text-gray-400">(⌘⇧S)</span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-red-600 text-white text-xs rounded-md whitespace-nowrap shadow-lg z-50"
          >
            {error}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-red-600" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ScreenshotButton;