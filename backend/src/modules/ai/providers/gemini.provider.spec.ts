import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeminiProvider } from './gemini.provider';
// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiProvider,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string | number | boolean> = {
                'ai.geminiApiKey': 'test-api-key',
                'ai.geminiModel': 'gemini-2.0-flash',
                'ai.maxRetries': 1,
                'ai.timeoutMs': 5000,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    provider = module.get<GeminiProvider>(GeminiProvider);
    mockFetch.mockClear();
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  describe('generateText', () => {
    it('should return generated text on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'Hello from Gemini' }],
              },
            },
          ],
        }),
      });

      const result = await provider.generateText({
        systemPrompt: 'You are helpful',
        userMessage: 'Say hello',
      });
      expect(result).toBe('Hello from Gemini');
    });

    it('should handle generic 400 error without retry', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Invalid request',
        json: async () => ({ error: { message: 'Invalid request' } }),
      });

      await expect(
        provider.generateText({ systemPrompt: '', userMessage: 'test' }),
      ).rejects.toThrow('Gemini API client error 400: Invalid request');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle auth error (400 API_KEY_INVALID) without retry', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            error: {
              code: 400,
              message: 'API key expired. Please renew the API key.',
              status: 'INVALID_ARGUMENT',
              details: [
                {
                  '@type': 'type.googleapis.com/google.rpc.ErrorInfo',
                  reason: 'API_KEY_INVALID',
                },
              ],
            },
          }),
        json: async () => ({}),
      });

      await expect(
        provider.generateText({ systemPrompt: '', userMessage: 'test' }),
      ).rejects.toThrow(
        "Le service IA est indisponible en raison d'un problème de configuration",
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should handle 429 rate limit and retry', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limited',
        json: async () => ({}),
      });

      await expect(
        provider.generateText({ systemPrompt: '', userMessage: 'test' }),
      ).rejects.toThrow('Le service IA est temporairement indisponible');
      // Should call twice (initial + 1 retry)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle network error and retry', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => '',
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [{ text: 'Success after retry' }],
                },
              },
            ],
          }),
        });

      const result = await provider.generateText({
        systemPrompt: '',
        userMessage: 'test',
      });
      expect(result).toBe('Success after retry');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw after max retries exceeded', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        provider.generateText({ systemPrompt: '', userMessage: 'test' }),
      ).rejects.toThrow('Le service IA est temporairement indisponible');
    });
  });

  describe('generateStructured', () => {
    it('should return parsed JSON', async () => {
      const mockResponse = {
        intent: 'ANSWER_BUSINESS_QUESTION',
        confidence: 0.95,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify(mockResponse) }],
              },
            },
          ],
        }),
      });

      const result = await provider.generateStructured({
        systemPrompt: '',
        userMessage: 'What is revenue?',
        parseResponse: (raw: string) => JSON.parse(raw),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle malformed JSON gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'not valid json',
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: 'not valid json' }],
              },
            },
          ],
        }),
      });

      await expect(
        provider.generateStructured({
          systemPrompt: '',
          userMessage: 'test',
          parseResponse: () => {
            throw new Error('Réponse IA malformée');
          },
        }),
      ).rejects.toThrow('Réponse IA malformée');
    });

    it('should handle empty candidates and throw unavailable', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => '',
        json: async () => ({
          candidates: [],
        }),
      });

      await expect(
        provider.generateText({
          systemPrompt: '',
          userMessage: 'test',
        }),
      ).rejects.toThrow('Le service IA est temporairement indisponible');
    });
  });
});
