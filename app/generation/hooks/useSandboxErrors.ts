'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SandboxError } from '@/components/HMRErrorDetector';

export interface ErrorFixAttempt {
  error: SandboxError;
  attemptNumber: number;
  timestamp: number;
  status: 'pending' | 'fixing' | 'fixed' | 'failed';
  fixMessage?: string;
}

interface UseSandboxErrorsProps {
  enabled?: boolean;
  maxAutoFixAttempts?: number;
  autoFixDelay?: number;
  onAutoFixRequest?: (error: SandboxError, attemptNumber: number) => Promise<void>;
  addChatMessage?: (content: string, type: 'user' | 'ai' | 'system' | 'error' | 'command', metadata?: any) => void;
}

interface UseSandboxErrorsReturn {
  // Current errors
  errors: SandboxError[];
  hasErrors: boolean;
  currentError: SandboxError | null;
  
  // Error management
  addError: (error: SandboxError) => void;
  clearErrors: () => void;
  dismissError: (errorTimestamp: number) => void;
  
  // Auto-fix state
  isAutoFixing: boolean;
  currentFixAttempt: ErrorFixAttempt | null;
  fixHistory: ErrorFixAttempt[];
  
  // Auto-fix control
  triggerAutoFix: (error?: SandboxError) => Promise<void>;
  cancelAutoFix: () => void;
  
  // Event handlers (for HMRErrorDetector)
  handleErrorDetected: (errors: SandboxError[]) => void;
  handleErrorCleared: () => void;
}

export function useSandboxErrors({
  enabled = true,
  maxAutoFixAttempts = 3,
  autoFixDelay = 2000,
  onAutoFixRequest,
  addChatMessage
}: UseSandboxErrorsProps = {}): UseSandboxErrorsReturn {
  const [errors, setErrors] = useState<SandboxError[]>([]);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [currentFixAttempt, setCurrentFixAttempt] = useState<ErrorFixAttempt | null>(null);
  const [fixHistory, setFixHistory] = useState<ErrorFixAttempt[]>([]);
  
  const autoFixTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef<Map<string, number>>(new Map());
  const cancelledRef = useRef(false);

  // Generate a unique key for an error to track fix attempts
  const getErrorKey = useCallback((error: SandboxError): string => {
    return `${error.type}:${error.message}:${error.file || ''}`;
  }, []);

  // Get the current attempt count for an error
  const getAttemptCount = useCallback((error: SandboxError): number => {
    return attemptCountRef.current.get(getErrorKey(error)) || 0;
  }, [getErrorKey]);

  // Increment attempt count
  const incrementAttemptCount = useCallback((error: SandboxError): number => {
    const key = getErrorKey(error);
    const current = attemptCountRef.current.get(key) || 0;
    const next = current + 1;
    attemptCountRef.current.set(key, next);
    return next;
  }, [getErrorKey]);

  // Reset attempt count for an error
  const resetAttemptCount = useCallback((error: SandboxError): void => {
    attemptCountRef.current.delete(getErrorKey(error));
  }, [getErrorKey]);

  // Clear all attempt counts
  const clearAllAttemptCounts = useCallback((): void => {
    attemptCountRef.current.clear();
  }, []);

  // Add an error to the list
  const addError = useCallback((error: SandboxError) => {
    setErrors(prev => {
      // Check if this error is already in the list
      const exists = prev.some(e => 
        e.message === error.message && 
        e.file === error.file && 
        e.type === error.type
      );
      if (exists) return prev;
      return [...prev, error];
    });
  }, []);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
    clearAllAttemptCounts();
    if (autoFixTimeoutRef.current) {
      clearTimeout(autoFixTimeoutRef.current);
      autoFixTimeoutRef.current = null;
    }
    setIsAutoFixing(false);
    setCurrentFixAttempt(null);
  }, [clearAllAttemptCounts]);

  // Dismiss a specific error
  const dismissError = useCallback((errorTimestamp: number) => {
    setErrors(prev => {
      const error = prev.find(e => e.timestamp === errorTimestamp);
      if (error) {
        resetAttemptCount(error);
      }
      return prev.filter(e => e.timestamp !== errorTimestamp);
    });
  }, [resetAttemptCount]);

  // Generate auto-fix prompt based on error type
  const generateFixPrompt = useCallback((error: SandboxError, attemptNumber: number): string => {
    const attemptSuffix = attemptNumber > 1 
      ? ` (Attempt ${attemptNumber}/${maxAutoFixAttempts} - please try a different approach)` 
      : '';
    
    switch (error.type) {
      case 'npm-missing':
        return `I'm getting an error: "${error.message}". Please add the missing import or install the package "${error.package || 'unknown'}".${attemptSuffix}`;
      
      case 'syntax-error':
        const fileInfo = error.file ? ` in file ${error.file}` : '';
        const lineInfo = error.line ? ` at line ${error.line}` : '';
        return `There's a syntax error${fileInfo}${lineInfo}: "${error.message}". Please fix this syntax issue.${attemptSuffix}`;
      
      case 'runtime-error':
        return `I'm getting a runtime error: "${error.message}"${error.file ? ` in ${error.file}` : ''}. Please fix this error.${attemptSuffix}`;
      
      case 'build-error':
        return `The build is failing with: "${error.message}"${error.file ? ` in ${error.file}` : ''}. Please fix this build error.${attemptSuffix}`;
      
      default:
        return `I'm getting an error: "${error.message}". Please investigate and fix this issue.${attemptSuffix}`;
    }
  }, [maxAutoFixAttempts]);

  // Trigger auto-fix for an error
  const triggerAutoFix = useCallback(async (error?: SandboxError) => {
    const targetError = error || errors[0];
    if (!targetError || !onAutoFixRequest || !enabled) {
      console.log('[useSandboxErrors] Cannot auto-fix: no error or handler');
      return;
    }
    
    cancelledRef.current = false;
    
    const attemptNumber = incrementAttemptCount(targetError);
    
    if (attemptNumber > maxAutoFixAttempts) {
      console.log(`[useSandboxErrors] Max auto-fix attempts (${maxAutoFixAttempts}) reached for error`);
      addChatMessage?.(
        `Unable to auto-fix after ${maxAutoFixAttempts} attempts. Please review the error manually: "${targetError.message}"`,
        'system'
      );
      return;
    }
    
    console.log(`[useSandboxErrors] Triggering auto-fix attempt ${attemptNumber} for:`, targetError);
    
    const attempt: ErrorFixAttempt = {
      error: targetError,
      attemptNumber,
      timestamp: Date.now(),
      status: 'pending',
      fixMessage: generateFixPrompt(targetError, attemptNumber)
    };
    
    setCurrentFixAttempt(attempt);
    setIsAutoFixing(true);
    
    // Add system message about auto-fix
    addChatMessage?.(
      `🔧 Auto-fixing ${targetError.type === 'npm-missing' ? 'missing package' : targetError.type.replace('-', ' ')}: "${targetError.message}"${attemptNumber > 1 ? ` (attempt ${attemptNumber})` : ''}`,
      'system'
    );
    
    try {
      setCurrentFixAttempt(prev => prev ? { ...prev, status: 'fixing' } : null);
      
      await onAutoFixRequest(targetError, attemptNumber);
      
      if (!cancelledRef.current) {
        setCurrentFixAttempt(prev => prev ? { ...prev, status: 'fixed' } : null);
        setFixHistory(prev => [...prev, { ...attempt, status: 'fixed' }]);
      }
    } catch (err: any) {
      console.error('[useSandboxErrors] Auto-fix failed:', err);
      
      if (!cancelledRef.current) {
        setCurrentFixAttempt(prev => prev ? { ...prev, status: 'failed' } : null);
        setFixHistory(prev => [...prev, { ...attempt, status: 'failed' }]);
        
        addChatMessage?.(`Auto-fix attempt failed: ${err.message}`, 'error');
      }
    } finally {
      if (!cancelledRef.current) {
        setIsAutoFixing(false);
        setCurrentFixAttempt(null);
      }
    }
  }, [errors, enabled, maxAutoFixAttempts, onAutoFixRequest, addChatMessage, incrementAttemptCount, generateFixPrompt]);

  // Cancel ongoing auto-fix
  const cancelAutoFix = useCallback(() => {
    cancelledRef.current = true;
    
    if (autoFixTimeoutRef.current) {
      clearTimeout(autoFixTimeoutRef.current);
      autoFixTimeoutRef.current = null;
    }
    
    setIsAutoFixing(false);
    setCurrentFixAttempt(null);
  }, []);

  // Handle new errors detected by HMRErrorDetector
  const handleErrorDetected = useCallback((detectedErrors: SandboxError[]) => {
    if (!enabled || detectedErrors.length === 0) return;
    
    const newError = detectedErrors[0];
    console.log('[useSandboxErrors] Error detected:', newError);
    
    addError(newError);
    
    // Check if we should auto-fix
    if (!isAutoFixing && onAutoFixRequest) {
      const attemptCount = getAttemptCount(newError);
      
      if (attemptCount < maxAutoFixAttempts) {
        // Clear any existing timeout
        if (autoFixTimeoutRef.current) {
          clearTimeout(autoFixTimeoutRef.current);
        }
        
        // Schedule auto-fix after delay
        console.log(`[useSandboxErrors] Scheduling auto-fix in ${autoFixDelay}ms`);
        autoFixTimeoutRef.current = setTimeout(() => {
          triggerAutoFix(newError);
        }, autoFixDelay);
      }
    }
  }, [enabled, isAutoFixing, maxAutoFixAttempts, autoFixDelay, onAutoFixRequest, addError, getAttemptCount, triggerAutoFix]);

  // Handle errors being cleared
  const handleErrorCleared = useCallback(() => {
    console.log('[useSandboxErrors] Errors cleared');
    
    // Clear the pending auto-fix timeout
    if (autoFixTimeoutRef.current) {
      clearTimeout(autoFixTimeoutRef.current);
      autoFixTimeoutRef.current = null;
    }
    
    // Clear errors but keep fix history
    setErrors([]);
    
    // If we were fixing and it's now clear, it worked
    if (isAutoFixing && currentFixAttempt) {
      setCurrentFixAttempt(prev => prev ? { ...prev, status: 'fixed' } : null);
      addChatMessage?.('✅ Error fixed successfully!', 'system');
    }
    
    setIsAutoFixing(false);
    setCurrentFixAttempt(null);
  }, [isAutoFixing, currentFixAttempt, addChatMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoFixTimeoutRef.current) {
        clearTimeout(autoFixTimeoutRef.current);
      }
    };
  }, []);

  return {
    errors,
    hasErrors: errors.length > 0,
    currentError: errors[0] || null,
    
    addError,
    clearErrors,
    dismissError,
    
    isAutoFixing,
    currentFixAttempt,
    fixHistory,
    
    triggerAutoFix,
    cancelAutoFix,
    
    handleErrorDetected,
    handleErrorCleared
  };
}