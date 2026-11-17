import { NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";
import dns from "node:dns";

// Optimize DNS lookup for environments where IPv6 route may not be available
try {
  dns.setDefaultResultOrder("ipv4first");
} catch {
  // Ignore in environments where not supported
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ReviewRequestBody {
  code?: unknown;
  language?: string;
  focus?: string;
}

export async function POST(req: Request) {
  try {
    let body: ReviewRequestBody;
    try {
      body = (await req.json()) as ReviewRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format in request body." },
        { status: 400 }
      );
    }

    const { code, language = "Auto-Detect", focus = "Full Audit" } = body || {};

    // 1. Input Validation: Check empty, whitespace, or invalid type
    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Input cannot be empty. Please paste valid code to review." },
        { status: 400 }
      );
    }

    // 2. Input Validation: Check minimum length (< 10 chars)
    if (code.trim().length < 10) {
      return NextResponse.json(
        { error: "Code snippet is too short (minimum 10 characters required)." },
        { status: 400 }
      );
    }

    // 3. Input Validation: Check maximum length (> 10,000 chars)
    if (code.length > 10000) {
      return NextResponse.json(
        { error: "Input exceeds maximum allowed length of 10,000 characters." },
        { status: 400 }
      );
    }

    // 4. Environment Check: Verify GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json(
        { error: "Server configuration error: GEMINI_API_KEY is missing." },
        { status: 500 }
      );
    }

    // Initialize Google Generative AI Provider
    const google = createGoogleGenerativeAI({
      apiKey,
    });

    // Model selection: Defaults to gemini-2.5-flash as specified in requirements,
    // with environment override support (e.g. GEMINI_MODEL=gemini-3.5-flash-lite)
    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const systemPrompt = `You are CodePulse AI, a world-class Principal Software Security Architect and Senior Static Code Analysis Engine.
Perform an in-depth, rigorous, and actionable code audit of the submitted code snippet.

Context Parameters:
- Language: ${language}
- Audit Focus: ${focus}

You MUST strictly organize your response into the following 4 structured sections using clear markdown headings:

### 1. Executive Summary & Severity Score
- Provide an overall Code Health Score (0 - 100) and an overall Severity Rating (Critical, High, Medium, Low, or Clean).
- Provide a high-level summary of architectural integrity, maintainability, and code hygiene.
- Detail Key Metric ratings: Complexity, Reliability, Security Posture.

### 2. Critical Bugs & Edge Cases
- Itemize syntax errors, logical bugs, off-by-one errors, unhandled null/undefined values, resource leaks, or race conditions.
- Specify exact lines or patterns responsible for each issue.
- Clearly contrast current buggy behavior against expected behavior.

### 3. Security & Performance Bottlenecks
- Flag security vulnerabilities (e.g. Injection, XSS, ReDoS, SSRF, memory leaks, unsafe deserialization, missing bounds checks, exposed secrets).
- Identify performance bottlenecks, asymptotic time/space inefficiencies (e.g. O(N²) when O(N) is feasible), unindexed queries, or memory churn.
- Specifically hone in on concerns relevant to the selected audit focus: "${focus}".

### 4. Refactored Production Code
- Provide a complete, hardened, production-ready replacement for the submitted code snippet.
- Include proper error boundaries, defensive checks, type safety, and clean documentation comments.
- Conclude with a concise deployment verification checklist (1-3 bullet points).

Tone: Objective, deeply technical, precise, and immediately actionable. Output clean, GitHub-flavored Markdown.`;

    const userPrompt = `Please audit the following ${language} code with primary focus on "${focus}":\n\n\`\`\`${language !== "Auto-Detect" ? language.toLowerCase() : ""}\n${code}\n\`\`\``;

    // Use streamText from ai SDK
    const result = streamText({
      model: google(modelId),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    console.error("CodePulse API Error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred during code analysis.";
    const status =
      typeof error === "object" && error !== null && "status" in error && typeof (error as { status: unknown }).status === "number"
        ? (error as { status: number }).status
        : 500;
    return NextResponse.json({ error: errorMessage }, { status });
  }
}
