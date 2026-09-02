import Anthropic from '@anthropic-ai/sdk';
import type { ZodType, z } from 'zod';
import { env } from '../../config/env';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

/** Strips ```json fences a model sometimes wraps its answer in. */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return body.trim();
  return body.slice(start, end + 1);
}

export class ClaudeCallError extends Error {}

/**
 * Sends one message and validates the JSON reply against `schema`.
 *
 * Every caller in this codebase treats a thrown error here as "Claude is
 * unavailable" and falls back to the offline engine (see provider.ts) — this
 * function's only job is to fail loudly and fast when the response cannot be
 * trusted, never to guess at a partial result.
 */
export async function askClaudeForJson<T extends ZodType>(options: {
  model: string;
  system: string;
  prompt: string;
  schema: T;
  maxTokens?: number;
}): Promise<z.infer<T>> {
  if (!env.aiEnabled) {
    throw new ClaudeCallError('AI is not enabled on this server.');
  }

  let raw: string;
  try {
    const response = await getClient().messages.create({
      model: options.model,
      max_tokens: options.maxTokens ?? 4096,
      system: options.system,
      messages: [{ role: 'user', content: options.prompt }],
    });

    raw = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n')
      .trim();
  } catch (error) {
    throw new ClaudeCallError(`Claude request failed: ${(error as Error).message}`);
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(extractJson(raw));
  } catch {
    throw new ClaudeCallError('Claude did not return valid JSON.');
  }

  const result = options.schema.safeParse(parsedJson);
  if (!result.success) {
    throw new ClaudeCallError(`Claude's response did not match the expected shape: ${result.error.message}`);
  }

  return result.data;
}
