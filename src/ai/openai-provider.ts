import OpenAI from 'openai';
import type { ZodType } from 'zod';
import type { AIProvider, CompletionRequest, CompletionResponse } from './provider';
import { logger } from '../logger';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string, baseURL?: string) {
    this.client = new OpenAI({ apiKey, baseURL });
    this.model = model;
  }

  async complete(req: CompletionRequest): Promise<CompletionResponse> {
    logger.debug({ model: this.model }, 'OpenAI complete');
    const res = await this.client.chat.completions.create({
      model: this.model,
      temperature: req.temperature ?? 0,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        ...(req.system ? [{ role: 'system' as const, content: req.system }] : []),
        { role: 'user' as const, content: req.user },
      ],
    });

    const content = res.choices[0]?.message?.content ?? '';
    return {
      content,
      usage: {
        inputTokens: res.usage?.prompt_tokens ?? 0,
        outputTokens: res.usage?.completion_tokens ?? 0,
      },
    };
  }

  async structured<T>(req: CompletionRequest, schema: ZodType<T>): Promise<T> {
    const jsonReq: CompletionRequest = {
      ...req,
      system: `${req.system ?? ''}\n\nRespond with valid JSON only. No markdown fences, no commentary.`,
    };
    const res = await this.complete(jsonReq);

    const cleaned = res.content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    return schema.parse(parsed);
  }
}