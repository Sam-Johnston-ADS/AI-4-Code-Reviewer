"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  FileCode2,
  Flame,
  Gauge,
  RotateCcw,
  Shield,
  ShieldAlert,
  Sparkles,
  Square,
  Terminal,
  Zap,
} from "lucide-react";

// Language definitions and sample buggy snippets
const LANGUAGES = [
  "Auto-Detect",
  "Python",
  "TypeScript / JS",
  "C / C++",
  "Java",
  "SQL",
  "Go",
  "Rust",
] as const;

type Language = (typeof LANGUAGES)[number];

const AUDIT_FOCUSES = [
  { id: "Full Audit", label: "Full Audit", icon: Shield, desc: "Holistic health, bugs & security" },
  { id: "Security & Bugs", label: "Security & Bugs", icon: ShieldAlert, desc: "OWASP, injection & edge-cases" },
  { id: "Performance & Complexity", label: "Performance & Complexity", icon: Gauge, desc: "Time/space complexity & bottlenecks" },
  { id: "Clean Code & Refactoring", label: "Clean Code & Refactoring", icon: Sparkles, desc: "Architecture, SOLID & idioms" },
] as const;

type AuditFocus = (typeof AUDIT_FOCUSES)[number]["id"];

const SAMPLE_CODES: Record<Language, string> = {
  "Auto-Detect": `import sqlite3

# Sample: Vulnerable User Authentication & Statistics Service
def get_user_dashboard(user_id, session_cache={}):
    # Bug 1: Dangerous mutable default argument (session_cache)
    # Bug 2: Critical SQL Injection vulnerability
    db = sqlite3.connect("production_users.db")
    cursor = db.cursor()
    query = f"SELECT * FROM users WHERE id = '{user_id}' AND is_active = 1"
    cursor.execute(query)
    user = cursor.fetchone()
    
    # Bug 3: Potential DivisionByZero & Unhandled NoneType dereference
    metrics = {
        "username": user[1],
        "conversion_rate": user[4] / user[5], # Crash if user[5] == 0
        "score": user[6] * 1.25
    }
    
    # Bug 4: Memory leak - connection is never closed
    session_cache[user_id] = metrics
    return session_cache`,

  Python: `import sqlite3
import hashlib

def process_transaction(account_id, amount, audit_log=[]):
    """
    Processes a financial withdrawal with audit logging.
    Contains critical security, memory, and logical flaws.
    """
    # Flaw 1: Mutable default argument persists state across calls
    # Flaw 2: Direct string formatting SQL Injection
    conn = sqlite3.connect("bank.db")
    cursor = conn.cursor()
    cursor.execute(f"SELECT balance, status FROM accounts WHERE id = '{account_id}'")
    account = cursor.fetchone()

    # Flaw 3: Insecure password / PIN hash using deprecated MD5
    pin_hash = hashlib.md5(b"user_pin_1234").hexdigest()

    # Flaw 4: Race condition / No transaction lock or rollback
    current_balance = account[0]
    if current_balance >= amount:
        new_balance = current_balance - amount
        # Flaw 5: Off-by-one / Missing WHERE clause boundary check
        cursor.execute(f"UPDATE accounts SET balance = {new_balance}")
        conn.commit()

    # Flaw 6: Unclosed connection causing connection pool exhaustion
    audit_log.append({"account": account_id, "amount": amount})
    return audit_log`,

  "TypeScript / JS": `import { Request, Response } from 'express';

// Sample: Express API Endpoint with Prototype Pollution & Concurrency Bugs
const globalUserCache: Record<string, any> = {};

export async function handleUserProfileUpdate(req: Request, res: Response) {
  const { userId, profileData, role } = req.body;

  // Bug 1: Mass assignment & Prototype Pollution
  for (const key in profileData) {
    globalUserCache[key] = profileData[key]; // Dangerous __proto__ pollution
  }

  // Bug 2: Missing authorization check for role privilege escalation
  if (role) {
    globalUserCache[userId].role = role;
  }

  // Bug 3: Unhandled Promise rejection & Event listener memory leak
  window?.addEventListener('message', () => {
    console.log('User synced:', userId); // Never deregistered
  });

  // Bug 4: Insecure equality check and float calculation
  const totalCredits = 0.1 + 0.2; // 0.30000000000000004
  if (totalCredits === 0.3) {
    res.json({ success: true });
  } else {
    // Hangs connection - forgotten return statement & double send
    res.status(500).send("Floating point error");
  }
}`,

  "C / C++": `#include <stdio.h>
#include <string.h>
#include <stdlib.h>

// Sample: Legacy String Parsing & Network Buffer Processor
char* parse_packet_payload(const char* raw_packet, int len) {
    // Bug 1: Stack Buffer Overflow (fixed-size buffer without bounds check)
    char buffer[64];
    strcpy(buffer, raw_packet);

    // Bug 2: Memory leak - malloc without corresponding free()
    char* log_entry = (char*)malloc(128);
    sprintf(log_entry, "Processed packet of len %d: %s", len, buffer);

    // Bug 3: Returning pointer to local stack variable (Dangling Pointer)
    return buffer;
}

int main() {
    char input[] = "A excessively long payload string that exceeds sixty-four characters easily...";
    char* result = parse_packet_payload(input, strlen(input));
    printf("Result: %s\\n", result); // Undefined behavior
    return 0;
}`,

  Java: `package com.enterprise.security;

import java.sql.*;
import java.io.*;

public class AccountManager {
    // Bug 1: Hardcoded credentials & SQL Injection
    private static final String DB_URL = "jdbc:mysql://localhost:3306/prod_db";
    private static final String DB_USER = "admin";
    private static final String DB_PASS = "admin123456";

    public boolean transferFunds(String fromUser, String toUser, double amount) throws Exception {
        Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASS);
        Statement stmt = conn.createStatement();

        // Critical SQL Injection
        String query = "SELECT balance FROM accounts WHERE username = '" + fromUser + "'";
        ResultSet rs = stmt.executeQuery(query);

        // Bug 2: Missing null checks and unhandled empty ResultSet
        rs.next();
        double balance = rs.getDouble("balance");

        if (balance >= amount) {
            stmt.executeUpdate("UPDATE accounts SET balance = balance - " + amount + " WHERE username = '" + fromUser + "'");
            stmt.executeUpdate("UPDATE accounts SET balance = balance + " + amount + " WHERE username = '" + toUser + "'");
            return true;
        }

        // Bug 3: Resource leak - Statement and Connection never closed
        return false;
    }
}`,

  SQL: `-- Sample: Reporting Query with Cartesian Product & Exfiltration Risk
SELECT 
    u.id, 
    u.full_name, 
    u.credit_card_number, -- Bug 1: Exposing sensitive unencrypted PCI data
    o.order_id, 
    o.amount,
    p.status
FROM users u, orders o, payments p -- Bug 2: Accidental Cartesian Product (CROSS JOIN)
WHERE u.id = o.user_id
  AND o.amount > 1000
-- Bug 3: Missing payment table join predicate
-- Bug 4: No LIMIT or Pagination on multi-million row table
ORDER BY o.created_at DESC;`,

  Go: `package main

import (
	"fmt"
	"net/http"
	"sync"
)

var userStats = make(map[string]int)

// Bug 1: Data Race - unsynchronized concurrent write to shared map
// Bug 2: Goroutine leak with unbuffered channel
func TrackVisit(userId string) {
	ch := make(chan bool) // unbuffered

	go func() {
		// Concurrent map mutation without sync.RWMutex
		userStats[userId]++
		ch <- true // Will block forever if no reader reads from ch
	}()
}

func handler(w http.ResponseWriter, r *http.Request) {
	userId := r.URL.Query().Get("user")
	// Bug 3: SSRF / Open Redirect flaw
	target := r.URL.Query().Get("redirect")
	TrackVisit(userId)
	http.Redirect(w, r, target, http.StatusFound)
}`,

  Rust: `use std::collections::HashMap;

// Sample: Inefficient and Panic-Prone Numerical Aggregator
pub fn calculate_weighted_average(data: &[u64], weights: &HashMap<usize, u64>) -> f64 {
    let mut total_sum: u64 = 0;
    let mut weight_sum: u64 = 0;

    for (i, &val) in data.iter().enumerate() {
        // Bug 1: Integer overflow risk on u64 addition
        // Bug 2: Direct unwrap() on HashMap lookup panics if index missing
        let w = weights.get(&i).unwrap(); 
        total_sum += val * w;
        weight_sum += w;
    }

    // Bug 3: Silent division by zero if weight_sum is 0
    (total_sum as f64) / (weight_sum as f64)
}`,
};

export default function WorkbenchPage() {
  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<Language>("TypeScript / JS");
  const [focus, setFocus] = useState<AuditFocus>("Full Audit");
  const [review, setReview] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const reviewContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll output container while streaming
  useEffect(() => {
    if (isLoading && reviewContainerRef.current) {
      reviewContainerRef.current.scrollTop = reviewContainerRef.current.scrollHeight;
    }
  }, [review, isLoading]);

  const charCount = code.length;
  const isOverLimit = charCount > 10000;
  const isWarningLimit = charCount > 8500 && !isOverLimit;

  // Handler: Load sample buggy code
  const handleLoadSample = () => {
    const sample = SAMPLE_CODES[language] || SAMPLE_CODES["Auto-Detect"];
    setCode(sample);
    setError(null);
  };

  // Handler: Clear workbench
  const handleClear = () => {
    setCode("");
    setReview("");
    setError(null);
  };

  // Handler: Copy review report
  const handleCopyReport = async () => {
    if (!review) return;
    try {
      await navigator.clipboard.writeText(review);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setError("Failed to copy report to clipboard.");
    }
  };

  // Handler: Abort stream
  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  // Core stream runner
  const executeAudit = async (codeToSubmit: string) => {
    setError(null);
    setReview("");

    // Client-side strict validation
    if (!codeToSubmit || codeToSubmit.trim().length === 0) {
      setError("Input cannot be empty. Please paste valid code to review.");
      return;
    }

    if (codeToSubmit.trim().length < 10) {
      setError("Code snippet is too short (minimum 10 characters required).");
      return;
    }

    if (codeToSubmit.length > 10000) {
      setError("Input exceeds maximum allowed length of 10,000 characters.");
      return;
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: codeToSubmit,
          language,
          focus,
        }),
        signal: controller.signal,
      });

      // Handle non-OK status (validation or server error)
      if (!response.ok) {
        let serverErrorMsg = `Analysis request failed (HTTP ${response.status})`;
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrorMsg = errData.error;
          }
        } catch {
          const textErr = await response.text().catch(() => "");
          if (textErr) serverErrorMsg = textErr;
        }
        setError(serverErrorMsg);
        setIsLoading(false);
        return;
      }

      if (!response.body) {
        setError("Readable stream not available on response.");
        setIsLoading(false);
        return;
      }

      // Stream reader with TextDecoder
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setReview(accumulated);
      }

      // Flush final stream
      accumulated += decoder.decode();
      setReview(accumulated);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        // User aborted intentionally
      } else {
        console.error("Audit Stream Error:", err);
        const msg = err instanceof Error ? err.message : "An unexpected error interrupted the audit stream.";
        setError(msg);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Primary action button
  const handleRunAudit = () => {
    executeAudit(code);
  };

  // Secondary action: Explicitly trigger Empty Input test (for direct validation verification)
  const handleTestEmptyInput = () => {
    executeAudit("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Application Navigation & Telemetry Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="h-5 w-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-sky-300 bg-clip-text text-transparent">
                  CodePulse AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                  Workbench
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Code Reviewer & Static Analysis Real-Time Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-300">Gemini Flash Inference Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Split-Pane Workbench Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 flex flex-col">
        {/* Error Notification Banner */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-950/70 border border-red-500/60 p-4 shadow-xl shadow-red-950/40 text-red-100 flex items-start justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-lg bg-red-900/50 text-red-400 mt-0.5 border border-red-700/50">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-red-200">Validation / System Error</h4>
                <p className="text-sm text-red-300/90 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs font-medium px-2.5 py-1 rounded-md bg-red-900/60 hover:bg-red-800/80 text-red-200 border border-red-700/60 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-stretch">
          {/* ========================================================= */}
          {/* LEFT PANEL: CODE INPUT & AUDIT CONTROLS                   */}
          {/* ========================================================= */}
          <section className="flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
            {/* Header / Selector Controls */}
            <div className="space-y-4 pb-4 border-b border-slate-800/80">
              {/* Language Selector Dropdown */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileCode2 className="h-3.5 w-3.5 text-sky-400" />
                    Target Language
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Syntax & Context Detection
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    disabled={isLoading}
                    className="w-full appearance-none bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-medium transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang} className="bg-slate-950 text-slate-200">
                        {lang}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Audit Focus Pills */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-indigo-400" />
                    Audit Focus
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">Select analysis lens</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AUDIT_FOCUSES.map(({ id, label, icon: Icon }) => {
                    const isSelected = focus === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFocus(id)}
                        disabled={isLoading}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-indigo-600/30 to-sky-600/30 border-sky-500/70 text-sky-200 shadow-md shadow-sky-950/50"
                            : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        } disabled:opacity-60`}
                      >
                        <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-sky-400" : "text-slate-500"}`} />
                        <span className="truncate">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Action Toolbar */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-slate-400" />
                  Source Code Buffer
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-sky-950/50 hover:bg-sky-900/60 text-sky-300 border border-sky-800/60 transition-colors disabled:opacity-50"
                    title="Populate realistic buggy snippet for quick evaluation"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Load Sample Buggy Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isLoading || !code}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors disabled:opacity-40"
                    title="Clear editor buffer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Code Textarea Editor with Monospace Styling */}
            <div className="mt-4 flex-1 flex flex-col min-h-[340px] relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`// Paste your ${language} source code here for static review...\n// Minimum 10 characters, maximum 10,000 characters.`}
                disabled={isLoading}
                spellCheck={false}
                className="w-full flex-1 bg-slate-950/90 border border-slate-800 hover:border-slate-700/90 focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 rounded-xl p-4 text-xs font-mono leading-relaxed text-slate-200 placeholder:text-slate-600 resize-none transition-all disabled:opacity-75 focus:outline-none"
              />

              {/* Character Counter & Live Threshold Indicator */}
              <div className="mt-2.5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Rules: Min 10 chars • Max 10,000 chars
                </span>
                <span
                  className={`font-mono px-2 py-0.5 rounded transition-colors ${
                    isOverLimit
                      ? "bg-red-950/80 text-red-400 border border-red-500/60 font-bold animate-pulse"
                      : isWarningLimit
                      ? "text-amber-400 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {charCount.toLocaleString()} / 10,000 chars
                </span>
              </div>
            </div>

            {/* Primary & Secondary Action Controls */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3">
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleStopStream}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-semibold text-sm shadow-lg shadow-red-950/50 transition-all cursor-pointer"
                >
                  <Square className="h-4 w-4 fill-white" />
                  <span>Stop Active Audit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRunAudit}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-semibold text-sm shadow-lg shadow-indigo-950/60 hover:shadow-indigo-500/20 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Zap className="h-4 w-4 fill-current text-sky-200" />
                  <span>Run Code Audit</span>
                </button>
              )}

              {/* Secondary button to test validation error handling directly */}
              <button
                type="button"
                onClick={handleTestEmptyInput}
                disabled={isLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/70 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
                title="Send empty payload to verify graceful backend 400 validation rejection"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Test Empty Input Error</span>
              </button>
            </div>
          </section>

          {/* ========================================================= */}
          {/* RIGHT PANEL: STREAMING REVIEW OUTPUT WORKBENCH            */}
          {/* ========================================================= */}
          <section className="flex flex-col bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 shadow-2xl backdrop-blur-sm relative">
            {/* Header: Analysis Status & Quick Actions */}
            <div className="pb-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-sky-400" />
                <h3 className="text-sm font-semibold text-slate-200">Structured Audit Report</h3>

                {/* State Badge */}
                {isLoading && (
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Streaming live analysis...
                  </span>
                )}
                {!isLoading && review && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-800/60">
                    <CheckCircle2 className="h-3 w-3" />
                    Audit Complete
                  </span>
                )}
                {!isLoading && !review && !error && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800/60 text-slate-400 border border-slate-700/60">
                    Awaiting Input
                  </span>
                )}
              </div>

              {/* Copy Report Button */}
              {review && (
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Output Scrollable Body */}
            <div
              ref={reviewContainerRef}
              className="mt-4 flex-1 overflow-y-auto max-h-[640px] pr-2 rounded-xl"
            >
              {/* STATE 1: IDLE STATE (Placeholder Cards) */}
              {!isLoading && !review && !error && (
                <div className="h-full flex flex-col justify-center items-center text-center py-12 px-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-4 shadow-inner">
                    <Terminal className="h-8 w-8 text-sky-500/70" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-200">Static Analysis Workbench Ready</h4>
                  <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                    Select your language and audit focus on the left, then paste code or load sample buggy code.
                    The engine streams an exhaustive 4-stage architectural review.
                  </p>

                  {/* 4 Report Sections Preview Blueprint */}
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg text-left">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold">
                        <Activity className="h-3.5 w-3.5" />
                        <span>1. Executive Summary</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Severity scoring (0-100), health grade, architectural hygiene & complexity assessment.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>2. Critical Bugs & Edge Cases</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Logic errors, off-by-one errors, null crashes, resource leaks & concurrency pitfalls.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>3. Security & Bottlenecks</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        OWASP vulnerabilities, injection vectors, memory churn & asymptotic O(N) optimizations.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>4. Refactored Code</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Hardened, drop-in replacement with error handling and deployment verification list.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STATE 2: LOADING SKELETON (Awaiting first streaming chunk) */}
              {isLoading && !review && (
                <div className="space-y-6 py-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-48 bg-slate-800/80 rounded-lg" />
                    <div className="h-5 w-24 bg-slate-800/60 rounded-full" />
                  </div>

                  {/* Executive Summary Skeleton */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-3">
                    <div className="h-4 w-36 bg-slate-800 rounded" />
                    <div className="h-3 w-full bg-slate-800/60 rounded" />
                    <div className="h-3 w-5/6 bg-slate-800/60 rounded" />
                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="h-10 bg-slate-800/40 rounded-lg" />
                      <div className="h-10 bg-slate-800/40 rounded-lg" />
                      <div className="h-10 bg-slate-800/40 rounded-lg" />
                    </div>
                  </div>

                  {/* Bugs Breakdown Skeleton */}
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/70 space-y-2.5">
                    <div className="h-4 w-44 bg-slate-800 rounded" />
                    <div className="h-3 w-4/5 bg-slate-800/60 rounded" />
                    <div className="h-3 w-3/4 bg-slate-800/60 rounded" />
                  </div>

                  {/* Code Skeleton */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                    <div className="h-4 w-32 bg-slate-800 rounded" />
                    <div className="h-24 w-full bg-slate-900 rounded-lg" />
                  </div>
                </div>
              )}

              {/* STATE 3 & 4: STREAMING & COMPLETED MARKDOWN RENDER */}
              {review && (
                <div className="prose-review text-slate-200">
                  <ReactMarkdown>{review}</ReactMarkdown>

                  {/* Active streaming tail indicator */}
                  {isLoading && (
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs text-emerald-400 font-mono">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Synthesizing static audit stream...</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CodePulse AI • Purpose-Built AI Code Reviewer & Static Analysis Workbench</span>
          <span>Powered by Next.js 14 App Router & Google Gemini</span>
        </div>
      </footer>
    </div>
  );
}
