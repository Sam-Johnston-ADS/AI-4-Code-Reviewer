# ReviewBot — AI Code Reviewer

**ReviewBot** is a production-quality, AI-powered code review web application. It delivers instant, structured, and constructive code reviews covering architecture, correctness bugs, security vulnerabilities, computational performance, style, and suggested improvements.

Unlike generic chat tools, ReviewBot is a single-purpose, paste-in / review-out engineering utility designed for rapid code inspection and refactoring.

---

## Features

- **Streaming Token Delivery**: Real-time streaming response powered by Vercel AI SDK (`streamText` + `@ai-sdk/react`).
- **Enforced 6-Section Structured Output**:
  1. **Summary**: High-level health check and architectural assessment.
  2. **Bugs & Correctness**: Edge cases, boundary errors, off-by-one mistakes, and null risks.
  3. **Security**: Injection (SQL/XSS/Command), secrets leakage, and OWASP risks.
  4. **Performance**: Computational Big-O complexity, memory leaks, and sequential I/O optimization.
  5. **Readability & Style**: Idiomatic conventions, clean naming, and maintainability.
  6. **Suggested Improvements**: Actionable recommendations with complete, syntax-highlighted corrected code.
- **Dual-Layer Input Validation**:
  - Rejects empty or whitespace-only code snippets.
  - Enforces 8,000 character maximum limit with a live visual counter.
  - Validates programming language against an allowlist (or auto-detect).
- **Abuse & DOS Protection**:
  - In-memory per-IP rate limiter (20 requests/minute with sliding window cleanup).
  - 64 KB request payload cap.
- **Instant Sample Snippets**:
  - 🐛 **Off-by-one Loop & Zero Division** (Bug benchmark)
  - 🛡️ **SQL Injection & Insecure Auth** (Security benchmark)
  - ⚡ **Unbounded Cache & Sequential I/O** (Performance benchmark)
- **Production UX**:
  - Dark / Light mode toggle with persistent preferences.
  - One-click "Copy Review" and per-snippet copy buttons.
  - One-click "Clear" button.
  - Visible loading indicators (animated spinner + pulsing status bar — no blank screens).
  - Dismissible error banner with one-click "Try again" action.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **AI Engine**: [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`, `@ai-sdk/react`, `@ai-sdk/google`, `@ai-sdk/openai`)
- **Markdown & Syntax Highlighting**: `react-markdown`, `remark-gfm`, `rehype-highlight`, `highlight.js`
- **Icons**: `lucide-react`

---

## Environment Variables

ReviewBot reads all AI API keys exclusively on the server side (`process.env`). Keys are never bundled or exposed to the client.

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set either a Google Gemini key (recommended) or an OpenAI key:

```env
# Google Gemini (Free tier available at https://aistudio.google.com/)
GEMINI_API_KEY="your-gemini-api-key"

# OR OpenAI (Optional alternative)
# OPENAI_API_KEY="your-openai-api-key"
```

---

## How to Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build and run production**:
   ```bash
   npm run build
   npm run start
   ```

4. **Lint and Typecheck**:
   ```bash
   npm run lint
   ```

---

## Design Decisions

1. **Single-Purpose Paste-In / Review-Out Interface**:
   Avoided conversational chat overhead. Developers want quick, focused code assessments without conversational preamble.
2. **Server-Side API Key Isolation**:
   All LLM interactions occur inside `app/api/review/route.ts`. The client only initiates a request and receives raw streaming tokens.
3. **Resilient Stream Preflight Validation**:
   Before returning HTTP 200, the route handler performs preflight validation on the stream iterator to intercept authentication or provider errors (such as invalid keys or quota limits). This allows the server to return an appropriate HTTP 4xx/5xx status with actionable error details rather than failing silently inside an open stream.
4. **Accessible Error Banner with Retry**:
   Error states are prominently displayed with an alert icon, clear message, and an instant "Try again" button to smoothly recover from transient failures.
