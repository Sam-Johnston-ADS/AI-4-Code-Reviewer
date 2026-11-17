export const MAX_CODE_LENGTH = 8000;
export const MAX_BODY_BYTES = 64 * 1024; // 64 KB

export const ALLOWED_LANGUAGES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'markdown', label: 'Markdown' },
] as const;

export type AllowedLanguageValue = (typeof ALLOWED_LANGUAGES)[number]['value'];

export const ALLOWED_LANGUAGE_VALUES: readonly string[] = ALLOWED_LANGUAGES.map((l) => l.value);

export const SYSTEM_PROMPT = `You are ReviewBot, an elite senior software engineer and principal security auditor.
Your job is to perform a rigorous, constructive, and highly structured code review on the provided code snippet.

You MUST structure your entire response using the following exact Markdown sections and headings:

## 1. Summary
A concise high-level overview of what the code does, its architecture or approach, and an overall assessment of code health (e.g. Production-Ready, Needs Minor Fixes, or Critical Issues Present).

## 2. Bugs & Correctness
Identify logic bugs, off-by-one errors, unhandled edge cases, null/undefined reference risks, race conditions, type mismatches, or syntax errors. If none are found, explicitly state "No major correctness bugs identified."

## 3. Security
Analyze potential vulnerabilities such as injection (SQL, Command, XSS), insecure deserialization, improper error handling leaking secrets, hardcoded credentials, buffer overflows, prototype pollution, or insecure cryptographic practices. If secure, explicitly state "No security vulnerabilities identified."

## 4. Performance
Evaluate computational complexity (time & space), memory leaks, redundant computations, unoptimized database/network queries, or blocking operations. Provide concrete optimization tips.

## 5. Readability & Style
Review naming conventions, modularity, adherence to idiomatic language conventions, comment clarity, and maintainability.

## 6. Suggested Improvements
Provide concrete, actionable recommendations. Include a complete, refactored, and corrected version of the code inside a syntax-highlighted code block addressing the identified issues. Explain what was changed and why.

Guidelines:
- Maintain an objective, professional, and encouraging tone.
- Be specific: cite line numbers, variable names, and function names when discussing issues.
- Format all code with appropriate markdown code blocks and syntax highlighting tags.`;

export interface SampleSnippet {
  id: string;
  title: string;
  description: string;
  language: AllowedLanguageValue;
  badge: 'Bug' | 'Security' | 'Performance';
  badgeColor: string;
  code: string;
}

export const SAMPLE_SNIPPETS: SampleSnippet[] = [
  {
    id: 'off-by-one-bug',
    title: 'Off-by-One Loop & Zero Division',
    description: 'Calculates rolling averages with boundary errors and missing edge case handling.',
    language: 'javascript',
    badge: 'Bug',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    code: `// Computes rolling averages for telemetry windows
function computeRollingAverages(data, windowSize) {
  let results = [];
  
  // Bug 1: Off-by-one in loop condition accesses undefined
  // Bug 2: Missing validation when windowSize is 0 or data is empty
  for (let i = 0; i <= data.length; i++) {
    let sum = 0;
    for (let j = 0; j <= windowSize; j++) {
      sum += data[i + j]; // May access undefined indexes
    }
    let avg = sum / windowSize; // Division by zero if windowSize is 0
    results.push(avg);
  }
  
  return results;
}`,
  },
  {
    id: 'sql-injection-flaw',
    title: 'SQL Injection & Auth Flaw',
    description: 'Direct SQL string concatenation, plaintext password comparison, and leaked traces.',
    language: 'typescript',
    badge: 'Security',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    code: `import { Request, Response } from 'express';
import db from './database';

export async function loginHandler(req: Request, res: Response) {
  const { username, password } = req.body;

  try {
    // Critical Security Flaw: Direct string interpolation vulnerable to SQL Injection
    const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
    const user = await db.raw(query);

    if (user) {
      // Insecure: returns entire user record including password hash / salt
      return res.status(200).json({ success: true, user });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (err: any) {
    // Leaks database schema and internal stack trace to client
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}`,
  },
  {
    id: 'memory-leak-perf',
    title: 'Unbounded Cache & Sequential I/O',
    description: 'Unbounded in-memory map causing OOM and sequential network requests.',
    language: 'typescript',
    badge: 'Performance',
    badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    code: `// Global cache that never evicts items (Memory leak)
const responseCache = new Map<string, any>();

export async function fetchUserProfiles(userIds: string[]) {
  const profiles = [];

  // Inefficient: Sequential awaits instead of parallel fetching
  for (const id of userIds) {
    if (responseCache.has(id)) {
      profiles.push(responseCache.get(id));
      continue;
    }

    const response = await fetch(\`https://api.example.com/users/\${id}\`);
    const data = await response.json();
    
    // Unbounded growth: cache will grow indefinitely until OOM
    responseCache.set(id, data);
    profiles.push(data);
  }

  return profiles;
}`,
  },
];
