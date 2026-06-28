import { registerAs } from '@nestjs/config';

export default registerAs(
  'ai',
  (): Record<string, unknown> => ({
    enabled: process.env.AI_ENABLED === 'true',
    provider: process.env.AI_PROVIDER ?? 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY ?? '',
    geminiModel:
      process.env.GEMINI_MODEL ??
      process.env.GEMINI_TEXT_MODEL ??
      'gemini-2.0-flash',
    requestTimeoutMs: parseInt(
      process.env.AI_REQUEST_TIMEOUT_MS ??
        process.env.AI_PROVIDER_TIMEOUT_MS ??
        '30000',
      10,
    ),
    maxRetries: parseInt(
      process.env.AI_MAX_RETRIES ?? process.env.AI_PROVIDER_RETRY_COUNT ?? '2',
      10,
    ),
  }),
);
