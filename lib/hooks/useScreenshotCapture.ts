'use client';

import { useState, useCallback, RefObject } from 'react';
import html2canvas from 'html2canvas';

export interface ScreenshotData {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  timestamp: Date;
}

interface UseScreenshotCaptureOptions {
  iframeRef?: RefObject<HTMLIFrameElement | null>;
  quality?: number;
  scale?: number;
}

/**
 * Hook to capture screenshots of the application preview
 * Supports capturing the entire viewport or specific elements
 */
export function useScreenshotCapture(options: UseScreenshotCaptureOptions = {}) {
  const { iframeRef, quality = 0.9, scale = 1 } = options;
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastScreenshot, setLastScreenshot] = useState<ScreenshotData | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Capture screenshot of the preview iframe
   */
  const capturePreview = useCallback(async (): Promise<ScreenshotData | null> => {
    if (!iframeRef?.current) {
      setError('No preview iframe available');
      return null;
    }

    setIsCapturing(true);
    setError(null);

    try {
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDocument) {
        // For cross-origin iframes, we can't access the document directly
        // Try to use the iframe container instead
        const iframeRect = iframe.getBoundingClientRect();
        
        // Create a canvas from the visible iframe area
        const canvas = document.createElement('canvas');
        canvas.width = iframeRect.width * scale;
        canvas.height = iframeRect.height * scale;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // For cross-origin iframes, we need to use a different approach
        // Try to capture the entire page and crop to the iframe area
        const bodyCanvas = await html2canvas(document.body, {
          scale,
          useCORS: true,
          allowTaint: true,
          x: iframeRect.left + window.scrollX,
          y: iframeRect.top + window.scrollY,
          width: iframeRect.width,
          height: iframeRect.height,
        });

        const dataUrl = bodyCanvas.toDataURL('image/png', quality);
        const blob = await new Promise<Blob>((resolve, reject) => {
          bodyCanvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          }, 'image/png', quality);
        });

        const screenshotData: ScreenshotData = {
          dataUrl,
          blob,
          width: iframeRect.width,
          height: iframeRect.height,
          timestamp: new Date(),
        };

        setLastScreenshot(screenshotData);
        setIsCapturing(false);
        return screenshotData;
      }

      // For same-origin iframes, capture the iframe content directly
      const canvas = await html2canvas(iframeDocument.body, {
        scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png', quality);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', quality);
      });

      const screenshotData: ScreenshotData = {
        dataUrl,
        blob,
        width: canvas.width,
        height: canvas.height,
        timestamp: new Date(),
      };

      setLastScreenshot(screenshotData);
      setIsCapturing(false);
      return screenshotData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture screenshot';
      setError(errorMessage);
      setIsCapturing(false);
      return null;
    }
  }, [iframeRef, quality, scale]);

  /**
   * Capture screenshot of a specific element
   */
  const captureElement = useCallback(async (element: HTMLElement): Promise<ScreenshotData | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const dataUrl = canvas.toDataURL('image/png', quality);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', quality);
      });

      const screenshotData: ScreenshotData = {
        dataUrl,
        blob,
        width: canvas.width,
        height: canvas.height,
        timestamp: new Date(),
      };

      setLastScreenshot(screenshotData);
      setIsCapturing(false);
      return screenshotData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture screenshot';
      setError(errorMessage);
      setIsCapturing(false);
      return null;
    }
  }, [quality, scale]);

  /**
   * Capture the entire visible viewport
   */
  const captureViewport = useCallback(async (): Promise<ScreenshotData | null> => {
    setIsCapturing(true);
    setError(null);

    try {
      const canvas = await html2canvas(document.body, {
        scale,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
      });

      const dataUrl = canvas.toDataURL('image/png', quality);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', quality);
      });

      const screenshotData: ScreenshotData = {
        dataUrl,
        blob,
        width: canvas.width,
        height: canvas.height,
        timestamp: new Date(),
      };

      setLastScreenshot(screenshotData);
      setIsCapturing(false);
      return screenshotData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture screenshot';
      setError(errorMessage);
      setIsCapturing(false);
      return null;
    }
  }, [quality, scale]);

  /**
   * Clear the current screenshot
   */
  const clearScreenshot = useCallback(() => {
    setLastScreenshot(null);
    setError(null);
  }, []);

  return {
    capturePreview,
    captureElement,
    captureViewport,
    clearScreenshot,
    isCapturing,
    lastScreenshot,
    error,
  };
}

export default useScreenshotCapture;