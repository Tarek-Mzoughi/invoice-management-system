export interface AiAttachment {
  mimeType: string;
  data: string; // base64
  fileName?: string;
}

export interface AiGenerateTextOptions {
  systemPrompt: string;
  userMessage: string;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  attachments?: AiAttachment[];
  temperature?: number;
  maxTokens?: number;
}

export interface AiGenerateStructuredOptions<T> extends AiGenerateTextOptions {
  responseSchema?: Record<string, unknown>;
  parseResponse: (raw: string) => T;
}

export interface AiProviderInterface {
  generateText(options: AiGenerateTextOptions): Promise<string>;
  generateStructured<T>(options: AiGenerateStructuredOptions<T>): Promise<T>;
}
