/**
 * Structured Logger - pino-based logging for the Open Lovable application
 *
 * This module provides:
 * - Structured JSON logging for production
 * - Pretty-printed logs for development
 * - File logging for debugging (logs/app.log)
 * - Context-aware child loggers
 * - Performance timing utilities
 * - Request/Response logging helpers
 *
 * Usage:
 * ```ts
 * import { logger, createChildLogger } from '@/lib/logger';
 *
 * // Basic logging
 * logger.info('Server started');
 * logger.error({ err: error }, 'Request failed');
 *
 * // Child logger with context
 * const sandboxLogger = createChildLogger('sandbox', { sandboxId: 'xyz' });
 * sandboxLogger.info('Sandbox created');
 *
 * // Performance timing
 * const { end } = logger.time('api-call');
 * // ... do work
 * end('API call completed');
 * ```
 *
 * Environment Variables:
 * - LOG_LEVEL: Set log level (trace, debug, info, warn, error, fatal)
 * - LOG_TO_FILE: Enable file logging (set to 'true')
 * - LOG_FILE_PATH: Custom log file path (default: logs/app.log)
 */

import pino, { Logger, LoggerOptions, TransportTargetOptions } from 'pino';
import path from 'path';
import fs from 'fs';

// Determine environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isServer = typeof window === 'undefined';

// File logging configuration
const LOG_TO_FILE = process.env.LOG_TO_FILE === 'true' || isDevelopment;
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || 'logs/app.log';
const LOG_DIR = path.dirname(LOG_FILE_PATH);

// Ensure log directory exists (server-side only)
if (isServer && LOG_TO_FILE) {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch {
    console.warn(`[logger] Could not create log directory: ${LOG_DIR}`);
  }
}

// Log levels
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

// Base configuration
const baseConfig: LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  // Custom serializers
  serializers: {
    // Error serializer
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    
    // Request serializer (for API routes)
    req: (req: any) => ({
      method: req.method,
      url: req.url,
      path: req.path,
      headers: {
        host: req.headers?.host,
        'user-agent': req.headers?.['user-agent'],
        'content-type': req.headers?.['content-type'],
      },
    }),
    
    // Response serializer
    res: (res: any) => ({
      statusCode: res.statusCode,
    }),
    
    // Sandbox serializer
    sandbox: (sandbox: any) => ({
      sandboxId: sandbox?.sandboxId,
      url: sandbox?.url,
      provider: sandbox?.provider,
    }),
  },
  
  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Base bindings
  base: {
    app: 'open-lovable',
    version: process.env.npm_package_version || '1.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  
  // Redact sensitive fields
  redact: {
    paths: [
      'headers.authorization',
      'headers.cookie',
      'apiKey',
      'password',
      'token',
      'secret',
      '*.apiKey',
      '*.password',
      '*.token',
      '*.secret',
    ],
    censor: '[REDACTED]',
  },
};

// Build transport targets for server-side logging
function buildServerTransport(): LoggerOptions['transport'] {
  const targets: TransportTargetOptions[] = [];
  
  // Console transport (pretty in dev, JSON in prod)
  if (isDevelopment) {
    targets.push({
      target: 'pino-pretty',
      level: baseConfig.level as string,
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageFormat: '{levelLabel} [{context}] {msg}',
        destination: 1, // stdout
      },
    });
  } else {
    targets.push({
      target: 'pino/file',
      level: baseConfig.level as string,
      options: { destination: 1 }, // stdout
    });
  }
  
  // File transport (always JSON for parsing)
  if (LOG_TO_FILE) {
    targets.push({
      target: 'pino/file',
      level: 'debug', // Capture more detail in file logs
      options: {
        destination: LOG_FILE_PATH,
        mkdir: true,
      },
    });
  }
  
  return targets.length > 0 ? { targets } : undefined;
}

// Server-side logger configuration
const serverConfig: LoggerOptions = {
  ...baseConfig,
  transport: buildServerTransport(),
};

// Browser-side logger (no pino-pretty, simplified output)
const browserConfig: LoggerOptions = {
  ...baseConfig,
  browser: {
    asObject: true,
    write: {
      info: (obj: any) => console.log('[INFO]', obj.msg || obj),
      error: (obj: any) => console.error('[ERROR]', obj.msg || obj, obj.err || ''),
      warn: (obj: any) => console.warn('[WARN]', obj.msg || obj),
      debug: (obj: any) => console.debug('[DEBUG]', obj.msg || obj),
      trace: (obj: any) => console.trace('[TRACE]', obj.msg || obj),
      fatal: (obj: any) => console.error('[FATAL]', obj.msg || obj, obj.err || ''),
    },
  },
};

// Create the appropriate logger for the environment
const createLogger = (): Logger => {
  if (isServer) {
    return pino(serverConfig);
  } else {
    return pino(browserConfig);
  }
};

// Export the main logger instance
export const logger = createLogger();

/**
 * Create a child logger with a specific context
 * Useful for adding consistent metadata to all logs from a module
 */
export function createChildLogger(
  context: string,
  bindings: Record<string, unknown> = {}
): Logger {
  return logger.child({ context, ...bindings });
}

// Pre-configured child loggers for common contexts
export const loggers = {
  sandbox: createChildLogger('sandbox'),
  ai: createChildLogger('ai'),
  api: createChildLogger('api'),
  scraping: createChildLogger('scraping'),
  generation: createChildLogger('generation'),
  build: createChildLogger('build'),
};

/**
 * Timing utility for performance logging
 */
export function createTimer(context: string) {
  const startTime = performance.now();
  const timerLogger = createChildLogger(context);
  
  return {
    /**
     * End the timer and log the duration
     */
    end: (message: string, additionalData?: Record<string, unknown>) => {
      const duration = performance.now() - startTime;
      timerLogger.info(
        { duration: `${duration.toFixed(2)}ms`, durationMs: duration, ...additionalData },
        message
      );
      return duration;
    },
    
    /**
     * Log an intermediate checkpoint
     */
    checkpoint: (message: string, additionalData?: Record<string, unknown>) => {
      const elapsed = performance.now() - startTime;
      timerLogger.debug(
        { elapsed: `${elapsed.toFixed(2)}ms`, elapsedMs: elapsed, ...additionalData },
        message
      );
      return elapsed;
    },
  };
}

// Extend logger with timing method
logger.time = (context: string) => createTimer(context);

/**
 * API Route logging middleware helper
 */
export function logApiRequest(
  req: Request,
  context: string,
  additionalData?: Record<string, unknown>
) {
  const apiLogger = createChildLogger('api', { route: context });
  const url = new URL(req.url);
  
  apiLogger.info(
    {
      method: req.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams),
      ...additionalData,
    },
    `${req.method} ${url.pathname}`
  );
  
  const timer = createTimer(`api:${context}`);
  
  return {
    success: (data?: Record<string, unknown>) => {
      const duration = timer.end('Request completed', { status: 200, ...data });
      return duration;
    },
    error: (error: Error, statusCode = 500) => {
      apiLogger.error(
        { err: error, statusCode },
        `Request failed: ${error.message}`
      );
    },
  };
}

/**
 * Sandbox operation logging helper
 */
export function logSandboxOperation(
  operation: 'create' | 'apply-code' | 'install-packages' | 'status' | 'kill',
  sandboxId?: string
) {
  const sandboxLogger = createChildLogger('sandbox', { sandboxId, operation });
  const timer = createTimer(`sandbox:${operation}`);
  
  sandboxLogger.info(`Starting ${operation}`);
  
  return {
    success: (data?: Record<string, unknown>) => {
      timer.end(`${operation} completed`, data);
    },
    error: (error: Error) => {
      sandboxLogger.error({ err: error }, `${operation} failed: ${error.message}`);
    },
    progress: (message: string, data?: Record<string, unknown>) => {
      sandboxLogger.debug(data, message);
    },
  };
}

/**
 * AI generation logging helper
 */
export function logAiGeneration(model: string, prompt: string) {
  const truncatedPrompt = prompt.length > 200 ? prompt.slice(0, 200) + '...' : prompt;
  const aiLogger = createChildLogger('ai', { model });
  const timer = createTimer('ai:generation');
  
  aiLogger.info({ promptLength: prompt.length, truncatedPrompt }, 'Starting AI generation');
  
  return {
    streaming: (chunkCount: number, totalLength: number) => {
      aiLogger.debug({ chunkCount, totalLength }, 'Streaming progress');
    },
    complete: (filesGenerated: number) => {
      timer.end('AI generation completed', { filesGenerated });
    },
    error: (error: Error) => {
      aiLogger.error({ err: error }, `AI generation failed: ${error.message}`);
    },
  };
}

/**
 * Web scraping logging helper
 */
export function logWebScraping(url: string) {
  const scrapingLogger = createChildLogger('scraping', { url });
  const timer = createTimer('scraping');
  
  scrapingLogger.info('Starting web scraping');
  
  return {
    screenshot: () => {
      timer.checkpoint('Screenshot captured');
    },
    content: (contentLength: number) => {
      timer.checkpoint('Content extracted', { contentLength });
    },
    complete: (data?: Record<string, unknown>) => {
      timer.end('Web scraping completed', data);
    },
    error: (error: Error) => {
      scrapingLogger.error({ err: error }, `Web scraping failed: ${error.message}`);
    },
  };
}

// Type augmentation for the timing method
declare module 'pino' {
  interface BaseLogger {
    time: (context: string) => ReturnType<typeof createTimer>;
  }
}

export default logger;