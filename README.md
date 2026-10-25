# AI Test Framework

An AI-powered Playwright test framework that generates structured test cases
from user stories, requirements, or Jira tickets — and (in later stages) turns
them into executable Playwright TypeScript tests.

## Current Status

| Stage | Status | Description |
|-------|--------|-------------|
| 1. Input | Planned | Jira / Confluence / user story ingestion |
| 2. Test Design | ✅ **Done** | Requirement JSON → structured test cases via LLM |
| 3. Code Generation | Planned | Test cases → Playwright `.spec.ts` files |
| 4. Quality Gates | Planned | Lint, typecheck, run, capture failures |
| 5. Reporting | Partial | Custom Playwright reporter writes structured JSON |

## What It Does Today

Given a requirement file like this:

```json
{
  "ticketId": "PROJ-1234",
  "title": "User can reset password via email",
  "description": "A registered user can request a password reset link via email. The link expires after 24 hours.",
  "acceptanceCriteria": [
    "Given a registered user, when they submit their email, then a reset email is sent",
    "Given a reset link clicked within 24 hours, then a password reset form is shown",
    "Given an expired reset link, then an error message 'Link expired' is shown"
  ]
}
```

The tool calls an LLM and produces:

```json
{
  "scenarios": [ { "id": "SC-1", "description": "...", "covers": ["AC-1"] } ],
  "testCases": [
    {
      "id": "TC-1",
      "scenarioId": "SC-1",
      "type": "positive",
      "title": "Registered user receives reset email",
      "steps": ["Navigate to login page", "..."],
      "expected": "An email is sent containing a reset link"
    }
  ],
  "gaps": ["Password complexity rules not specified"]
}
```

Output is written to `reports/test-design-<ticketId>.json` and validated with Zod
before being accepted.

## Tech Stack

- **Node.js** (>= 20) + **TypeScript** (strict, CommonJS)
- **Playwright Test** — test runner + API testing
- **Zod** — schema validation and type inference
- **OpenAI SDK** — LLM client, pointed at Groq's free OpenAI-compatible API
- **Pino** — structured logging
- **Commander** — CLI framework
- **tsx** — run TypeScript directly

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- A free **Groq** API key — https://console.groq.com/keys

## Installation

```bash
git clone https://github.com/rchincholikar/ai-test-framework.git
cd ai-test-framework
npm install
```

## Configuration

Copy the example env file and fill in your Groq key:

```bash
cp .env.example .env
```

Edit `.env`:

```env
OPENAI_API_KEY=gsk_your_actual_groq_key_here
AI_MODEL=openai/gpt-oss-20b
AI_BASE_URL=https://api.groq.com/openai/v1
```

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Groq API key (starts with `gsk_`) |
| `AI_MODEL` | Groq model ID — must include provider prefix (`openai/gpt-oss-20b` or `openai/gpt-oss-120b`) |
| `AI_BASE_URL` | Groq's OpenAI-compatible endpoint |

**Note:** `.env` is gitignored. Never commit real keys.

### Optional: switch to OpenAI

Replace `.env` values:

```env
OPENAI_API_KEY=sk-your-openai-key
AI_MODEL=gpt-4o-mini
AI_BASE_URL=https://api.openai.com/v1
```

## Usage

### Generate test cases from a requirement

```bash
npm run generate -- --file examples/requirement.json
```

Options:

| Flag | Default | Description |
|------|---------|-------------|
| `-f, --file <path>` | required | Path to requirement JSON |
| `-o, --output <dir>` | `reports` | Output directory |

**Expected output:**

```
[INFO] designTests: starting
[INFO] designTests: complete
[INFO] test design written

✅ Generated: reports/test-design-PROJ-1234.json
   Scenarios:  4
   Test cases: 8
   Gaps:       5
```

### Run Playwright tests

```bash
npm test
npm run test:ui
```

### Open the last HTML report

```bash
npm run report
```

### Type-check

```bash
npm run typecheck
```

## Project Structure

```
ai-test-framework/
├── examples/
│   └── requirement.json           # sample requirement input
├── reports/                       # generated output (gitignored)
├── src/
│   ├── ai/
│   │   ├── provider.ts            # AIProvider interface
│   │   └── openai-provider.ts     # OpenAI-compatible client (works with Groq)
│   ├── cli/
│   │   └── index.ts               # CLI entry point
│   ├── generator/
│   │   ├── prompts/
│   │   │   └── test-design.prompt.ts   # system + user prompt templates
│   │   └── test-design.ts         # orchestration + Zod schemas
│   ├── reporter/
│   │   └── ai-reporter.ts         # Playwright custom reporter
│   └── logger.ts                  # pino logger
├── tests/
│   ├── generated/                 # AI-generated tests (future)
│   └── schemas/                   # shared Zod schemas
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## How It Works

```
examples/requirement.json
        │
        ▼
src/cli/index.ts            (read file, init provider)
        │
        ▼
src/generator/test-design.ts  (orchestrate)
        │
        ├──▶ src/generator/prompts/test-design.prompt.ts   (build prompt)
        │
        ▼
src/ai/openai-provider.ts   (call LLM API)
        │
        ▼
Groq / OpenAI API
        │
        ▼
raw JSON response
        │
        ▼
Zod schema validation (TestDesignSchema)
        │
        ▼
reports/test-design-<ticketId>.json
```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm test` | Run all Playwright tests |
| `npm run test:ui` | Run Playwright in interactive UI mode |
| `npm run typecheck` | Type-check all TypeScript |
| `npm run generate` | Generate test cases from a requirement |
| `npm run report` | Open the last HTML report |

## Adding a New Requirement

1. Copy `examples/requirement.json` to a new file, e.g. `examples/PROJ-5678.json`
2. Fill in `ticketId`, `title`, `description`, `acceptanceCriteria`
3. Run:
   ```bash
   npm run generate -- --file examples/PROJ-5678.json
   ```
4. Check `reports/test-design-PROJ-5678.json`

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `OPENAI_API_KEY is not set` | `.env` missing or not loaded | Ensure `.env` exists in project root and `import 'dotenv/config'` is the first line of `src/cli/index.ts` |
| `404 model does not exist` | Wrong model ID | Use `openai/gpt-oss-20b` — the `openai/` prefix is required for Groq |
| `401 Unauthorized` | Key mismatch with base URL | Groq key (`gsk_...`) must go with `AI_BASE_URL=https://api.groq.com/openai/v1` |
| `ZodError` | LLM returned wrong JSON shape | Re-run, or tighten the prompt in `src/generator/prompts/test-design.prompt.ts` |
