import { NextRequest, NextResponse } from 'next/server';
import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import {
  MAX_CODE_LENGTH,
  MAX_BODY_BYTES,
  ALLOWED_LANGUAGE_VALUES,
  SYSTEM_PROMPT,
} from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  // 1. Abuse Protection: Content-Length check
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `Payload too large. Request body exceeds ${MAX_BODY_BYTES / 1024} KB limit.` },
      { status: 413 }
    );
  }

  // 2. Abuse Protection: In-memory Rate Limiting per IP
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';

  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Too many requests. Please wait ${rateLimit.retryAfterSeconds}s before trying again.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfterSeconds),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(rateLimit.resetTime),
        },
      }
    );
  }

  // 3. Body Parsing & Server-Side Input Validation
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (typeof parsed !== 'object' || parsed === null) {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  // Accept code either as "prompt" (from useCompletion) or "code"
  const rawCode = typeof body.prompt === 'string' ? body.prompt : body.code;
  const language = typeof body.language === 'string' ? body.language.toLowerCase().trim() : 'auto';

  // Validate empty or whitespace-only
  if (typeof rawCode !== 'string' || rawCode.trim().length === 0) {
    return NextResponse.json(
      { error: 'Code snippet cannot be empty or contain only whitespace.' },
      { status: 400 }
    );
  }

  // Validate max length
  if (rawCode.length > MAX_CODE_LENGTH) {
    return NextResponse.json(
      {
        error: `Code snippet exceeds the maximum length of ${MAX_CODE_LENGTH.toLocaleString()} characters (received ${rawCode.length.toLocaleString()} characters).`,
      },
      { status: 400 }
    );
  }

  // Validate language against allowlist
  if (!ALLOWED_LANGUAGE_VALUES.includes(language)) {
    return NextResponse.json(
      {
        error: `Unsupported programming language "${language}". Please choose from the supported list.`,
      },
      { status: 400 }
    );
  }

  // 4. Model Provider Resolution
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!geminiKey && !openaiKey) {
    return NextResponse.json(
      {
        error:
          'No AI provider API key found. Please configure GEMINI_API_KEY (recommended) or OPENAI_API_KEY in server environment variables.',
      },
      { status: 500 }
    );
  }

  let model;
  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    model = google('gemini-2.5-flash');
  } else {
    const openai = createOpenAI({ apiKey: openaiKey });
    model = openai('gpt-4o-mini');
  }

  const languageLabel = language === 'auto' ? 'Auto-detect' : language;
  const markdownLang = language === 'auto' ? '' : language;

  const userPrompt = `Target Language: ${languageLabel}

Code to review:
\`\`\`${markdownLang}
${rawCode}
\`\`\``;

  try {
    // 5. Call LLM Streaming API via AI SDK
    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.2, // Low temperature for consistent, analytical, and structured reviews
    });

    // Check fullStream to catch authentication/provider errors upfront before returning 200
    const iterator = result.fullStream[Symbol.asyncIterator]();
    let initialError: Error | null = null;
    let firstTextDelta: string | null = null;

    while (true) {
      const { done, value } = await iterator.next();
      if (done) break;
      if (value.type === 'error') {
        initialError =
          value.error instanceof Error
            ? value.error
            : new Error(String(value.error || 'AI Provider Error'));
        break;
      }
      if (value.type === 'text-delta') {
        firstTextDelta = value.text;
        break;
      }
    }

    if (initialError) {
      return NextResponse.json(
        {
          error: initialError.message || 'AI service returned an error.',
        },
        { status: 500 }
      );
    }

    // Stream text deltas as a clean UTF-8 text stream
    const textEncoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        if (firstTextDelta) {
          controller.enqueue(textEncoder.encode(firstTextDelta));
        }
        try {
          while (true) {
            const { done, value } = await iterator.next();
            if (done) break;
            if (value.type === 'text-delta') {
              controller.enqueue(textEncoder.encode(value.text));
            } else if (value.type === 'error') {
              controller.error(value.error);
              return;
            }
          }
          controller.close();
        } catch (streamErr) {
          controller.error(streamErr);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': String(rateLimit.resetTime),
      },
    });
  } catch (err: unknown) {
    console.error('Error generating review stream:', err);
    const errorMessage =
      err instanceof Error
        ? err.message
        : 'An unexpected error occurred while communicating with the AI service.';
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
