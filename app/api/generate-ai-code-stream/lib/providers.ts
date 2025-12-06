import { createGroq } from '@ai-sdk/groq';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Check if we're using Vercel AI Gateway
const isUsingAIGateway = !!process.env.AI_GATEWAY_API_KEY;
const aiGatewayBaseURL = 'https://ai-gateway.vercel.sh/v1';

console.log('[generate-ai-code-stream] AI Gateway config:', {
  isUsingAIGateway,
  hasGroqKey: !!process.env.GROQ_API_KEY,
  hasAIGatewayKey: !!process.env.AI_GATEWAY_API_KEY
});

export const groq = createGroq({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.GROQ_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : undefined,
});

export const anthropic = createAnthropic({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.ANTHROPIC_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1'),
});

export const googleGenerativeAI = createGoogleGenerativeAI({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.GEMINI_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : undefined,
});

export const openai = createOpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.OPENAI_API_KEY,
  baseURL: isUsingAIGateway ? aiGatewayBaseURL : process.env.OPENAI_BASE_URL,
});

export function getProviderAndModel(model: string): {
  provider: ReturnType<typeof createGroq | typeof createAnthropic | typeof createOpenAI | typeof createGoogleGenerativeAI>;
  actualModel: string;
  isAnthropic: boolean;
  isGoogle: boolean;
  isOpenAI: boolean;
  isKimiGroq: boolean;
} {
  const isAnthropic = model.startsWith('anthropic/');
  const isGoogle = model.startsWith('google/');
  const isOpenAI = model.startsWith('openai/');
  const isKimiGroq = model === 'moonshotai/kimi-k2-instruct-0905';
  
  const provider = isAnthropic ? anthropic : 
                    (isOpenAI ? openai : 
                    (isGoogle ? googleGenerativeAI : 
                    (isKimiGroq ? groq : groq)));
  
  let actualModel: string;
  if (isAnthropic) {
    actualModel = model.replace('anthropic/', '');
  } else if (isOpenAI) {
    actualModel = model.replace('openai/', '');
  } else if (isKimiGroq) {
    actualModel = 'moonshotai/kimi-k2-instruct-0905';
  } else if (isGoogle) {
    actualModel = model.replace('google/', '');
  } else {
    actualModel = model;
  }

  return {
    provider: provider as any,
    actualModel,
    isAnthropic,
    isGoogle,
    isOpenAI,
    isKimiGroq
  };
}

export { isUsingAIGateway };