'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Check, Copy } from 'lucide-react';

interface ReviewMarkdownProps {
  content: string;
}

function CodeBlockWithCopy({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  // Extract raw string text from children
  const getText = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(getText).join('');
    if (React.isValidElement<{ children?: React.ReactNode }>(node) && node.props.children) {
      return getText(node.props.children);
    }
    return '';
  };

  const codeText = getText(children);

  const handleCopy = async () => {
    if (!codeText) return;
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code snippet', err);
    }
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-3 top-3 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 backdrop-blur shadow-sm transition-all cursor-pointer"
          title="Copy snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="!mt-0 overflow-x-auto rounded-lg border border-slate-700/50 bg-[#0d1117] p-4 text-sm text-slate-100 shadow-inner">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function ReviewMarkdown({ content }: ReviewMarkdownProps) {
  return (
    <div className="review-markdown text-slate-800 dark:text-slate-200">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children }) {
            // Let the code component render the container
            return <>{children}</>;
          },
          code({ className, children, ...props }) {
            const isInline = !className && typeof children === 'string' && !children.includes('\n');
            if (isInline) {
              return (
                <code
                  className="rounded bg-slate-200/70 dark:bg-slate-800 px-1.5 py-0.5 text-xs font-mono text-blue-600 dark:text-blue-400"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlockWithCopy className={className} {...props}>
                {children}
              </CodeBlockWithCopy>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-6 mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2">
                {children}
              </h3>
            );
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{children}</li>;
          },
          p({ children }) {
            return <p className="text-sm leading-relaxed mb-3 text-slate-700 dark:text-slate-300">{children}</p>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
