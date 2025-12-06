/**
 * Error Monitoring - Centralized error tracking and reporting
 * 
 * This module provides:
 * - Sentry integration for error tracking
 * - Custom error boundaries
 * - Performance monitoring
 * - User feedback collection
 */

import { createChildLogger } from '@/lib/logger';

const logger = createChildLogger('monitoring');

// Error severity levels
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

// Error context for enhanced debugging
export interface ErrorContext {
  userId?: string;
  sandboxId?: string;
  aiModel?: string;
  action?: string;
  component?: string;
  url?: string;
  extra?: Record<string, unknown>;
}

// Error report for centralized handling
export interface ErrorReport {
  error: Error;
  severity: ErrorSeverity;
  context: ErrorContext;
  timestamp: Date;
  fingerprint?: string;
}

// In-memory error buffer for batch reporting
const errorBuffer: ErrorReport[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Initialize monitoring (call once at app start)
 */
export async function initMonitoring(): Promise<void> {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (dsn && typeof window !== 'undefined') {
    try {
      // Dynamic import for optional Sentry dependency
      // @ts-expect-error - Sentry is optional
      const Sentry = await import('@sentry/nextjs').catch(() => null);
      
      if (Sentry) {
        Sentry.init({
          dsn,
          environment: process.env.NODE_ENV,
          tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
          
          beforeSend(event: any) {
            // Scrub sensitive data
            if (event.request?.headers) {
              delete event.request.headers['authorization'];
              delete event.request.headers['cookie'];
            }
            return event;
          },
        });
        
        logger.info('Sentry monitoring initialized');
      }
    } catch (error) {
      logger.warn({ error }, 'Failed to initialize Sentry, using fallback');
    }
  } else {
    logger.info('Sentry DSN not configured, using console fallback');
  }
}

/**
 * Capture and report an error
 */
export function captureError(
  error: Error,
  context: ErrorContext = {},
  severity: ErrorSeverity = 'error'
): void {
  const report: ErrorReport = {
    error,
    severity,
    context,
    timestamp: new Date(),
    fingerprint: generateFingerprint(error, context),
  };
  
  // Log locally
  logger.error({ 
    error, 
    context, 
    severity,
    fingerprint: report.fingerprint,
  }, error.message);
  
  // Add to buffer
  errorBuffer.push(report);
  if (errorBuffer.length > MAX_BUFFER_SIZE) {
    errorBuffer.shift();
  }
  
  // Try Sentry if available
  reportToSentry(report);
}

/**
 * Report to Sentry asynchronously
 */
async function reportToSentry(report: ErrorReport): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // @ts-expect-error - Sentry is optional
    const Sentry = await import('@sentry/nextjs').catch(() => null);
    
    if (Sentry?.withScope) {
      Sentry.withScope((scope: any) => {
        scope.setLevel(report.severity);
        
        if (report.context.userId) {
          scope.setUser({ id: report.context.userId });
        }
        
        scope.setTags({
          action: report.context.action,
          component: report.context.component,
          aiModel: report.context.aiModel,
        });
        
        scope.setExtras({
          sandboxId: report.context.sandboxId,
          url: report.context.url,
          ...report.context.extra,
        });
        
        if (report.fingerprint) {
          scope.setFingerprint([report.fingerprint]);
        }
        
        Sentry.captureException(report.error);
      });
    }
  } catch {
    // Sentry not available, already logged
  }
}

/**
 * Generate a fingerprint for error deduplication
 */
function generateFingerprint(error: Error, context: ErrorContext): string {
  const parts = [
    error.name,
    error.message.slice(0, 100),
    context.action || '',
    context.component || '',
  ];
  return parts.join(':');
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(
  message: string,
  level: ErrorSeverity = 'info',
  context: ErrorContext = {}
): void {
  logger.info({ message, level, context }, message);
  
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Sentry is optional
    import('@sentry/nextjs').then((Sentry: any) => {
      Sentry?.captureMessage?.(message, level);
    }).catch(() => {});
  }
}

/**
 * Set user context for all subsequent errors
 */
export function setUser(userId: string, email?: string): void {
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Sentry is optional
    import('@sentry/nextjs').then((Sentry: any) => {
      Sentry?.setUser?.({ id: userId, email });
    }).catch(() => {});
  }
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Sentry is optional
    import('@sentry/nextjs').then((Sentry: any) => {
      Sentry?.setUser?.(null);
    }).catch(() => {});
  }
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string = 'navigation'
): { finish: () => void } {
  const startTime = performance.now();
  
  logger.debug({ transaction: name, op }, 'Transaction started');
  
  return {
    finish: () => {
      const duration = performance.now() - startTime;
      logger.debug({ transaction: name, op, durationMs: duration }, 'Transaction finished');
    },
  };
}

/**
 * Create an error boundary wrapper for React components
 */
export function createErrorBoundary(componentName: string) {
  return {
    onError: (error: Error, errorInfo: { componentStack: string }) => {
      captureError(error, {
        component: componentName,
        extra: { componentStack: errorInfo.componentStack },
      }, 'error');
    },
    fallback: `An error occurred in ${componentName}`,
  };
}

/**
 * Get recent errors from buffer (for debugging)
 */
export function getRecentErrors(): ErrorReport[] {
  return [...errorBuffer];
}

/**
 * Clear error buffer
 */
export function clearErrorBuffer(): void {
  errorBuffer.length = 0;
}

/**
 * Helper for API route error handling
 */
export function handleApiError(
  error: Error,
  route: string,
  context: Record<string, unknown> = {}
): { status: number; message: string } {
  captureError(error, {
    action: 'api-request',
    url: route,
    extra: context,
  });
  
  // Determine appropriate status code
  const statusMap: Record<string, number> = {
    'ValidationError': 400,
    'UnauthorizedError': 401,
    'ForbiddenError': 403,
    'NotFoundError': 404,
    'RateLimitError': 429,
  };
  
  const status = statusMap[error.name] || 500;
  
  return {
    status,
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred' 
      : error.message,
  };
}

const monitoring = {
  init: initMonitoring,
  captureError,
  captureMessage,
  setUser,
  clearUser,
  startTransaction,
  handleApiError,
  getRecentErrors,
};

export default monitoring;