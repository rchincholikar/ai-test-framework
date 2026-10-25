import type { AIProvider } from '../ai/provider';
import { logger } from '../logger';
import {
  TEST_DESIGN_SYSTEM_PROMPT,
  buildTestDesignUserPrompt,
} from './prompts/test-design.prompt';
import { z } from 'zod';

export interface Requirement {
  ticketId: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
}

export const ScenarioSchema = z.object({
  id: z.string(),
  description: z.string(),
  covers: z.array(z.string()),
});

export const TestCaseSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  type: z.enum(['positive', 'negative', 'edge']),
  title: z.string(),
  steps: z.array(z.string()),
  expected: z.string(),
});

export const TestDesignSchema = z.object({
  scenarios: z.array(ScenarioSchema),
  testCases: z.array(TestCaseSchema),
  gaps: z.array(z.string()),
});

export type TestDesign = z.infer<typeof TestDesignSchema>;

export async function designTests(
  ai: AIProvider,
  req: Requirement,
): Promise<TestDesign> {
  logger.info({ ticketId: req.ticketId }, 'designTests: starting');

  const result = await ai.structured(
    {
      system: TEST_DESIGN_SYSTEM_PROMPT,
      user: buildTestDesignUserPrompt(req),
      temperature: 0,
    },
    TestDesignSchema,
  );

  logger.info(
    {
      ticketId: req.ticketId,
      scenarios: result.scenarios.length,
      testCases: result.testCases.length,
      gaps: result.gaps.length,
    },
    'designTests: complete',
  );

  return result;
}