import type { ZodType } from 'zod';

export interface CompletionRequest {
  system?: string;
  user: string;
  temperature?: number;
}

export interface CompletionResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface AIProvider {
  name: string;
  complete(req: CompletionRequest): Promise<CompletionResponse>;
  structured<T>(req: CompletionRequest, schema: ZodType<T>): Promise<T>;
}