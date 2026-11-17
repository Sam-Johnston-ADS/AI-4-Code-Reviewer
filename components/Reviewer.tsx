'use client';

import React, { useState } from 'react';
import { useCompletion } from '@ai-sdk/react';
import {
  Code2,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Square,
  ShieldAlert,
  Bug,
  Zap,
  CheckCircle2,
  Layers,
  Terminal,
  FileCode,
} from 'lucide-react';
import {
  MAX_CODE_LENGTH,
  ALLOWED_LANGUAGES,
  SAMPLE_SNIPPETS,
  AllowedLanguageValue,
  SampleSnippet,
} from '@/lib/constants';
import { ReviewMarkdown } from './ReviewMarkdown';
import { ErrorBanner } from './ErrorBanner';
import { ThemeToggle } from './ThemeToggle';

export function Reviewer() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState<AllowedLanguageValue>('auto');
  const [clientError, setClientError] = useState<string | null>(null);
  const [copiedReview, setCopiedReview] = useState(false);

  const {
    completion,
    complete,
    isLoading,
    error: apiError,
    setCompletion,
    stop,
  } = useCompletion({
    api: '/api/review',
    streamProtocol: 'text',
    onError: (err) => {
      let msg = err.message;
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error) msg = parsed.error;
      } catch {
        // use raw message
      }
      setClientError(msg);
    },
  });

  // Keep track of active error (either client-side validation or API failure)
  const activeError = clientError || (apiError ? apiError.message : null);

  const charCount = code.length;
  const isOverLimit = charCount > MAX_CODE_LENGTH;
  const isEmpty = code.trim().length === 0;
  const hasFirstToken = completion.length > 0;

  // Handle submit review
  const handleReview = async () => {
    // 1. Client-side validation: empty / whitespace
    if (isEmpty) {
      setClientError(
        'Code snippet cannot be empty or contain only whitespace. Paste your code or load a sample snippet below.'
      );
      return;
    }

    // 2. Client-side validation: max length
    if (isOverLimit) {
      setClientError(
        `Code snippet exceeds the maximum length of ${MAX_CODE_LENGTH.toLocaleString()} characters (${charCount.toLocaleString()} chars). Please trim your code.`
      );
      return;
    }

    // Clear previous errors
    setClientError(null);

    // Trigger AI SDK streaming completion
    try {
      await complete(code, {
        body: {
          language,
        },
      });
    } catch {
      // Handled by onError callback
    }
  };

  // Handle retry
  const handleRetry = () => {
    handleReview();
  };

  // Handle copy review
  const handleCopyReview = async () => {
    if (!completion) return;
    try {
      await navigator.clipboard.writeText(completion);
      setCopiedReview(true);
      setTimeout(() => setCopiedReview(false), 2000);
    } catch (err) {
      console.error('Failed to copy review:', err);
    }
  };

  // Handle clear all
  const handleClear = () => {
    stop();
    setCode('');
    setCompletion('');
    setClientError(null);
  };

  // Load sample snippet
  const handleLoadSample = (sample: SampleSnippet) => {
    stop();
    setCode(sample.code);
    setLanguage(sample.language);
    setClientError(null);
    setCompletion('');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  ReviewBot
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  AI Code Reviewer
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Architectural, Security, Performance & Correctness Analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 bg-slate-50 dark:bg-slate-800/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Model Online</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Banner */}
        <ErrorBanner
          error={activeError}
          onDismiss={() => setClientError(null)}
          onRetry={handleRetry}
          isRetrying={isLoading}
        />

        {/* Two-Column Responsive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left Panel: Input Code */}
          <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Input Snippet
                </span>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="language-select" className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Language:
                </label>
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as AllowedLanguageValue)}
                  disabled={isLoading}
                  className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                >
                  {ALLOWED_LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Sample Snippets Bar */}
            <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Samples:
              </span>
              {SAMPLE_SNIPPETS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs shrink-0 cursor-pointer disabled:opacity-50"
                  title={sample.description}
                >
                  <span
                    className={`text-[10px] font-semibold px-1 py-0.2 rounded border ${sample.badgeColor}`}
                  >
                    {sample.badge}
                  </span>
                  <span>{sample.title}</span>
                </button>
              ))}
            </div>

            {/* Code Input Area */}
            <div className="relative flex-1 p-4">
              <textarea
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (clientError) setClientError(null);
                }}
                placeholder="// Paste a function, class, or code snippet to review...&#10;// Example:&#10;function calculateDiscount(price, user) {&#10;  if (user.isVip) return price * 0.8;&#10;  return price;&#10;}"
                rows={18}
                disabled={isLoading}
                spellCheck={false}
                className="w-full resize-y rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-4 font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/80 disabled:opacity-60 transition-shadow"
              />
            </div>

            {/* Action Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
              {/* Character Counter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 dark:text-slate-400">Characters:</span>
                <span
                  className={`font-mono font-medium ${
                    isOverLimit
                      ? 'text-rose-600 dark:text-rose-400 font-bold'
                      : charCount > 7000
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {charCount.toLocaleString()} / {MAX_CODE_LENGTH.toLocaleString()}
                </span>
                {isOverLimit && (
                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                    (Limit exceeded)
                  </span>
                )}
              </div>

              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isLoading || (!code && !completion)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors shadow-2xs cursor-pointer disabled:opacity-40"
                  title="Clear snippet and review"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>

                {isLoading ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Review</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleReview}
                    disabled={isOverLimit || isEmpty}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Review Code</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Structured Review Output */}
          <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden min-h-[580px]">
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Review Output
                </span>

                {/* Status Badges */}
                {isLoading && !hasFirstToken && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                    Reviewing…
                  </span>
                )}

                {isLoading && hasFirstToken && (
                  <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    Streaming review…
                  </span>
                )}

                {!isLoading && hasFirstToken && (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Review Complete
                  </span>
                )}
              </div>

              {/* Output Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReview}
                  disabled={!completion}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-40"
                  title="Copy full review Markdown to clipboard"
                >
                  {copiedReview ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        Copied!
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Output Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* State 1: Visible Loading State before first token (No Blank Screen) */}
              {isLoading && !hasFirstToken && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-300">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-lg">
                      <Sparkles className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
                    </span>
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Analyzing code snippet…
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Evaluating logic correctness, security vulnerabilities, algorithmic performance, and code style…
                    </p>
                  </div>
                  {/* Subtle animated skeleton bars */}
                  <div className="w-full max-w-md space-y-2.5 pt-4">
                    <div className="h-3 bg-slate-200/80 dark:bg-slate-800/80 rounded-full animate-pulse w-3/4 mx-auto" />
                    <div className="h-3 bg-slate-200/60 dark:bg-slate-800/60 rounded-full animate-pulse w-5/6 mx-auto" />
                    <div className="h-3 bg-slate-200/40 dark:bg-slate-800/40 rounded-full animate-pulse w-2/3 mx-auto" />
                  </div>
                </div>
              )}

              {/* State 2: Progressively streaming or complete Markdown review */}
              {hasFirstToken && <ReviewMarkdown content={completion} />}

              {/* State 3: Idle Empty State */}
              {!isLoading && !hasFirstToken && (
                <div className="py-10 flex flex-col items-center text-center max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-400 mb-4 shadow-sm">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                    Ready for Code Review
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                    Paste your code snippet on the left and click <strong>&quot;Review Code&quot;</strong>, or pick a sample snippet to see an instant demonstration.
                  </p>

                  {/* 6 Structured Review Categories Grid */}
                  <div className="w-full grid grid-cols-2 gap-2.5 text-left">
                    <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                        <span className="text-blue-500 font-mono">1.</span>
                        <span>Summary</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        High-level health check & architecture overview.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                        <Bug className="w-3.5 h-3.5 text-amber-500" />
                        <span>Bugs & Logic</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Boundary conditions, null checks & race hazards.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                        <span>Security</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Injection, OWASP risks, and data leakage.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 mb-0.5">
                        <Zap className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Performance</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Big-O runtime, memory leaks & I/O optimization.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 mt-auto bg-white/50 dark:bg-slate-900/50 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>ReviewBot &bull; Automated, Production-Quality AI Code Reviewer</p>
      </footer>
    </div>
  );
}
