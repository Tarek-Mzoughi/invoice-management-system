import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AiProviderInterface,
  AiAttachment,
  AiGenerateTextOptions,
  AiGenerateStructuredOptions,
} from './ai-provider.interface';

class NonRetryableGeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableGeminiError';
  }
}

@Injectable()
export class GeminiProvider implements AiProviderInterface {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.geminiApiKey', '');
    this.model = this.configService.get<string>(
      'ai.geminiModel',
      'gemini-2.0-flash',
    );
    this.timeoutMs = this.configService.get<number>(
      'ai.requestTimeoutMs',
      30000,
    );
    this.maxRetries = this.configService.get<number>('ai.maxRetries', 2);
  }

  private getApiUrl(): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
  }

  private buildContents(
    systemPrompt: string,
    userMessage: string,
    history?: Array<{ role: 'user' | 'model'; content: string }>,
    attachments?: AiAttachment[],
  ) {
    type GeminiPart =
      | { text: string }
      | { inlineData: { mimeType: string; data: string } };
    const contents: Array<{ role: string; parts: GeminiPart[] }> = [];

    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [
          {
            text: `[SYSTEM INSTRUCTIONS]\n${systemPrompt}\n[END SYSTEM INSTRUCTIONS]`,
          },
        ],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Compris. Je suis prêt à vous aider.' }],
      });
    }

    if (history?.length) {
      for (const msg of history) {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.content }],
        });
      }
    }

    // Build user message parts (text + optional file attachments)
    const userParts: GeminiPart[] = [{ text: userMessage }];

    if (attachments?.length) {
      for (const att of attachments) {
        userParts.push({
          inlineData: {
            mimeType: att.mimeType,
            data: att.data,
          },
        });
      }
    }

    contents.push({ role: 'user', parts: userParts });

    return contents;
  }

  private async callApi(body: Record<string, unknown>): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(this.getApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          const errorBody = await response.text();
          if (response.status === 429) {
            this.logger.warn(`Gemini rate limit hit, attempt ${attempt + 1}`);
            if (attempt < this.maxRetries) {
              await this.delay(1000 * (attempt + 1));
              continue;
            }
            throw new Error('Gemini API rate limited after retries');
          }

          if (response.status >= 400 && response.status < 500) {
            const isAuthError =
              errorBody.includes('API_KEY_INVALID') ||
              errorBody.includes('API key expired');
            const message = isAuthError
              ? "Le service IA est indisponible en raison d'un problème de configuration (clé API invalide ou expirée)."
              : `Gemini API client error ${response.status}: ${errorBody}`;
            this.logger.error(message);
            throw new NonRetryableGeminiError(message);
          }

          throw new Error(`Gemini API error ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        if (!text) {
          throw new Error('Empty response from Gemini API');
        }

        return text;
      } catch (error) {
        lastError = error as Error;

        if (error instanceof NonRetryableGeminiError) {
          throw error;
        }

        if (error instanceof Error && error.name === 'AbortError') {
          this.logger.warn(`Gemini request timeout, attempt ${attempt + 1}`);
        }
        if (attempt < this.maxRetries) {
          await this.delay(1000 * (attempt + 1));
        }
      }
    }

    this.logger.error('Gemini API call failed after retries', lastError?.stack);
    throw new Error(
      'Le service IA est temporairement indisponible. Veuillez réessayer.',
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async generateText(options: AiGenerateTextOptions): Promise<string> {
    const contents = this.buildContents(
      options.systemPrompt,
      options.userMessage,
      options.history,
      options.attachments,
    );

    return this.callApi({
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 4096,
      },
    });
  }

  async generateStructured<T>(
    options: AiGenerateStructuredOptions<T>,
  ): Promise<T> {
    const contents = this.buildContents(
      options.systemPrompt,
      options.userMessage,
      options.history,
      options.attachments,
    );

    const raw = await this.callApi({
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens ?? 4096,
        responseMimeType: 'application/json',
      },
    });

    return options.parseResponse(raw);
  }
}
