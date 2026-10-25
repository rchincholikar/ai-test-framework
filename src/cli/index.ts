#!/usr/bin/env node
import 'dotenv/config'; 
import { Command } from 'commander';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { logger } from '../logger';
import { designTests, type Requirement } from '../generator/test-design';
import { OpenAIProvider } from '../ai/openai-provider';

const program = new Command();

program
  .name('ai-test')
  .description('AI-powered Playwright test framework')
  .version('0.1.0');

program
  .command('generate')
  .description('Generate test cases from a requirement JSON file')
  .requiredOption('-f, --file <path>', 'path to requirement JSON')
  .option('-o, --output <path>', 'output directory', 'reports')
  .action(async (opts: { file: string; output: string }) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        logger.error('OPENAI_API_KEY is not set');
        process.exit(1);
      }
      const model = process.env.AI_MODEL ?? 'gpt-4o-mini';
      const baseURL = process.env.AI_BASE_URL;

      const raw = await fs.readFile(opts.file, 'utf8');
      const requirement = JSON.parse(raw) as Requirement;

      const ai = new OpenAIProvider(apiKey, model, baseURL);
      const design = await designTests(ai, requirement);

      await fs.mkdir(opts.output, { recursive: true });
      const outFile = path.join(
        opts.output,
        `test-design-${requirement.ticketId}.json`,
      );
      await fs.writeFile(outFile, JSON.stringify(design, null, 2));

      logger.info({ outFile }, 'test design written');
      console.log(`\n✅ Generated: ${outFile}`);
      console.log(`   Scenarios:  ${design.scenarios.length}`);
      console.log(`   Test cases: ${design.testCases.length}`);
      console.log(`   Gaps:       ${design.gaps.length}`);
    } catch (err) {
      logger.error({ err }, 'generate failed');
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse();