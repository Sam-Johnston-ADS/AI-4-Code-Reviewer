'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ErrorBanner({
  error,
  onDismiss,
  onRetry,
  isRetrying = false,
}: ErrorBannerProps) {
  if (!error) return null;

  const isRateLimit = error.toLowerCase().includes('rate limit');
  const isKeyError = error.toLowerCase().includes('api key');

  return (
    <div
      role="alert"
      className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 dark:bg-rose-950/40 p-4 text-rose-800 dark:text-rose-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-100">
              {isRateLimit
                ? 'Rate Limit Encountered'
                : isKeyError
                ? 'Configuration Notice'
                : 'Review Request Failed'}
            </h4>
            <p className="text-sm text-rose-800/90 dark:text-rose-300 leading-relaxed break-words">
              {error}
            </p>

            {onRetry && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  <span>{isRetrying ? 'Retrying…' : 'Try again'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="p-1 rounded-md text-rose-600/70 hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-100 hover:bg-rose-500/20 transition-colors cursor-pointer"
          aria-label="Dismiss error banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
