/**
 * Dynamic AI Provider Loading - Code splitting for AI providers
 * 
 * This module provides lazy loading of AI provider SDKs to reduce
 * initial bundle size. Each provider is only loaded when first used.
 * 
 * Benefits:
 * - Reduced initial JavaScript bundle size (~50-100KB savings)
 * - Faster page load times
 * - Only pays the cost of loading providers actually used
 * 
 * Usage:
 * ```ts
 * const { client, actualModel } = await getDynamicProvider('anthropic/claude-sonnet-4');
 * ```
 */

import { appConfig } from '@/config/app.config';
import { createChildLogger, createTimer } from '@/lib/logger';

const logger = createChildLogger('ai-providers');

export type ProviderName = 'openai' | 'anthropic' | 'groq' | 'google';

// Type for provider factory functions
type ProviderFactory<T = unknown> = (config: { apiKey?: string; baseURL?: string }) => T;

// Cache for loaded provider modules
const moduleCache = new Map<ProviderName, ProviderFactory>();

// Cache for instantiated clients
const clientCache = new Map<string, unknown>();

// Environment configuration
const aiGatewayApiKey = process.env.AI_GATEWAY_API_KEY;
const aiGatewayBaseURL = 'https://ai-gateway.vercel.sh/v1';
const isUsingAIGateway = !!aiGatewayApiKey;

/**
 * Dynamic import functions for each provider
 * These are lazy - the import only happens when called
 */
const providerLoaders: Record<ProviderName, () => Promise<ProviderFactory>> = {
  openai: async () => {
    const timer = createTimer('dynamic-import:openai');
    const { createOpenAI } = await import('@ai-sdk/openai');
    timer.end('OpenAI SDK loaded');
    return createOpenAI;
  },
  
  anthropic: async () => {
    const timer = createTimer('dynamic-import:anthropic');
    const { createAnthropic } = await import('@ai-sdk/anthropic');
    timer.end('Anthropic SDK loaded');
    return createAnthropic;
  },
  
  groq: async () => {
    const timer = createTimer('dynamic-import:groq');
    const { createGroq } = await import('@ai-sdk/groq');
    timer.end('Groq SDK loaded');
    return createGroq;
  },
  
  google: async () => {
    const timer = createTimer('dynamic-import:google');
    const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
    timer.end('Google SDK loaded');
    return createGoogleGenerativeAI;
  },
};

/**
 * Get default environment configuration for a provider
 */
function getEnvDefaults(provider: ProviderName): { apiKey?: string; baseURL?: string } {
  if (isUsingAIGateway) {
    return { apiKey: aiGatewayApiKey, baseURL: aiGatewayBaseURL };
  }

  switch (provider) {
    case 'openai':
      return { apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL };
    case 'anthropic':
      return { 
        apiKey: process.env.ANTHROPIC_API_KEY, 
        baseURL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1' 
      };
    case 'groq':
      return { apiKey: process.env.GROQ_API_KEY, baseURL: process.env.GROQ_BASE_URL };
    case 'google':
      return { apiKey: process.env.GEMINI_API_KEY, baseURL: process.env.GEMINI_BASE_URL };
    default:
      return {};
  }
}

/**
 * Load a provider module dynamically with caching
 */
async function loadProviderModule(provider: ProviderName): Promise<ProviderFactory> {
  // Check module cache first
  const cached = moduleCache.get(provider);
  if (cached) {
    logger.debug({ provider }, 'Using cached provider module');
    return cached;
  }

  // Load dynamically
  const loader = providerLoaders[provider];
  if (!loader) {
    throw new Error(`Unknown provider: ${provider}. Available: ${Object.keys(providerLoaders).join(', ')}`);
  }

  logger.info({ provider }, 'Loading provider module dynamically');
  const factory = await loader();
  
  // Cache for future use
  moduleCache.set(provider, factory);
  
  return factory;
}

/**
 * Get or create a provider client with configuration
 */
async function getOrCreateClient(
  provider: ProviderName, 
  apiKey?: string, 
  baseURL?: string
): Promise<unknown> {
  const effective = isUsingAIGateway
    ? { apiKey: aiGatewayApiKey, baseURL: aiGatewayBaseURL }
    : { apiKey, baseURL };

  const cacheKey = `${provider}:${effective.apiKey || ''}:${effective.baseURL || ''}`;
  
  // Check client cache
  const cached = clientCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Load provider module and create client
  const factory = await loadProviderModule(provider);
  const defaults = getEnvDefaults(provider);
  
  const client = factory({
    apiKey: effective.apiKey || defaults.apiKey,
    baseURL: effective.baseURL ?? defaults.baseURL,
  });

  // Cache client
  clientCache.set(cacheKey, client);
  logger.debug({ provider, cacheKey }, 'Created and cached provider client');
  
  return client;
}

export interface DynamicProviderResolution {
  client: unknown;
  actualModel: string;
  provider: ProviderName;
}

/**
 * Get a provider dynamically for a given model ID
 * 
 * This is the main entry point - it determines the provider from the model ID,
 * loads the provider SDK dynamically if needed, and returns the configured client.
 */
export async function getDynamicProvider(modelId: string): Promise<DynamicProviderResolution> {
  const timer = createTimer('dynamic-provider');
  
  // 1) Check explicit model configuration in app config
  const configured = appConfig.ai.modelApiConfig?.[modelId as keyof typeof appConfig.ai.modelApiConfig];
  if (configured) {
    const { provider, apiKey, baseURL, model } = configured as { 
      provider: ProviderName; 
      apiKey?: string; 
      baseURL?: string; 
      model: string 
    };
    const client = await getOrCreateClient(provider, apiKey, baseURL);
    timer.end('Provider resolved from config', { provider, modelId });
    return { client, actualModel: model, provider };
  }

  // 2) Determine provider from model ID prefix
  let provider: ProviderName;
  let actualModel: string;

  if (modelId === 'moonshotai/kimi-k2-instruct-0905') {
    provider = 'groq';
    actualModel = 'moonshotai/kimi-k2-instruct-0905';
  } else if (modelId.startsWith('anthropic/')) {
    provider = 'anthropic';
    actualModel = modelId.replace('anthropic/', '');
  } else if (modelId.startsWith('openai/')) {
    provider = 'openai';
    actualModel = modelId.replace('openai/', '');
  } else if (modelId.startsWith('google/')) {
    provider = 'google';
    actualModel = modelId.replace('google/', '');
  } else {
    // Default to Groq
    provider = 'groq';
    actualModel = modelId;
  }

  const client = await getOrCreateClient(provider);
  timer.end('Provider resolved', { provider, modelId, actualModel });
  
  return { client, actualModel, provider };
}

/**
 * Preload provider modules in the background
 * Useful for warming up providers you expect to use
 */
export async function preloadProviders(providers: ProviderName[]): Promise<void> {
  logger.info({ providers }, 'Preloading provider modules');
  
  await Promise.allSettled(
    providers.map((provider) => loadProviderModule(provider))
  );
  
  logger.info({ providers }, 'Provider modules preloaded');
}

/**
 * Check which providers are currently loaded
 */
export function getLoadedProviders(): ProviderName[] {
  return Array.from(moduleCache.keys());
}

/**
 * Clear all caches (useful for testing or memory management)
 */
export function clearProviderCaches(): void {
  moduleCache.clear();
  clientCache.clear();
  logger.info('Provider caches cleared');
}

/**
 * Get available providers based on environment configuration
 */
export function getAvailableProviders(): ProviderName[] {
  const available: ProviderName[] = [];
  
  if (isUsingAIGateway) {
    // AI Gateway supports all providers
    return ['openai', 'anthropic', 'groq', 'google'];
  }
  
  if (process.env.OPENAI_API_KEY) available.push('openai');
  if (process.env.ANTHROPIC_API_KEY) available.push('anthropic');
  if (process.env.GROQ_API_KEY) available.push('groq');
  if (process.env.GEMINI_API_KEY) available.push('google');
  
  return available;
}

export default getDynamicProvider;