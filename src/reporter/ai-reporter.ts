import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface TestRecord {
  title: string;
  status: TestResult['status'];
  duration: number;
  error?: string;
  jiraTicket?: string;
}

export default class AiReporter implements Reporter {
  private results: TestRecord[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    this.results.push({
      title: test.title,
      status: result.status,
      duration: result.duration,
      error: result.error?.message,
      jiraTicket: test.annotations.find((a) => a.type === 'jira')?.description,
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    await fs.mkdir('reports', { recursive: true });
    await fs.writeFile(
      path.join('reports', 'ai-results.json'),
      JSON.stringify({ status: result.status, tests: this.results }, null, 2),
    );
  }
}