'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface ResizableSplitterProps {
  children: [React.ReactNode, React.ReactNode];
  initialLeftWidth?: number;
  minLeftWidth?: number;
  maxLeftWidth?: number;
  className?: string;
  storageKey?: string;
}

export function ResizableSplitter({
  children,
  initialLeftWidth = 560,
  minLeftWidth = 300,
  maxLeftWidth = 900,
  className = '',
  storageKey = 'resizable-splitter-width'
}: ResizableSplitterProps) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= minLeftWidth && parsed <= maxLeftWidth) {
        setLeftWidth(parsed);
      }
    }
    setIsHydrated(true);
  }, [storageKey, minLeftWidth, maxLeftWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startWidthRef.current = leftWidth;
  }, [leftWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    const newWidth = Math.min(maxLeftWidth, Math.max(minLeftWidth, startWidthRef.current + deltaX));
    setLeftWidth(newWidth);
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem(storageKey, leftWidth.toString());
    }
  }, [isDragging, leftWidth, storageKey]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const effectiveWidth = isHydrated ? leftWidth : initialLeftWidth;
  const gripDotClass = isDragging 
    ? 'bg-orange-500' 
    : 'bg-gray-400 dark:bg-gray-500 group-hover:bg-orange-500';

  return (
    <div className={`flex-1 h-full overflow-hidden ${className}`}>
      <div className="hidden lg:flex h-full">
        <div 
          style={{ width: `${effectiveWidth}px` }}
          className="flex-shrink-0 h-full overflow-hidden"
        >
          {children[0]}
        </div>
        
        <div 
          className="w-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-orange-400/50 dark:hover:bg-orange-500/50 cursor-col-resize group transition-colors duration-150 relative flex-shrink-0 flex items-center justify-center border-x border-gray-200/50 dark:border-gray-700/50"
          onMouseDown={handleMouseDown}
        >
          <div className={`flex flex-col gap-1.5 transition-opacity ${isDragging ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
            <div className={`w-1 h-1 rounded-full transition-colors ${gripDotClass}`} />
            <div className={`w-1 h-1 rounded-full transition-colors ${gripDotClass}`} />
            <div className={`w-1 h-1 rounded-full transition-colors ${gripDotClass}`} />
          </div>
        </div>
        
        <div className="flex-1 h-full overflow-hidden">
          {children[1]}
        </div>
      </div>

      <div className="flex flex-col h-full lg:hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          {children[1]}
        </div>
        <div className="h-[45vh] flex-shrink-0 border-t border-gray-200 dark:border-gray-700 overflow-hidden">
          {children[0]}
        </div>
      </div>
    </div>
  );
}