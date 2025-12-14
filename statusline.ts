#!/usr/bin/env bun
/**
 * Claude Code Statusline Script
 * Shows: Model | Git Branch [changes] | Project | Context % | Cost
 *
 * Parses transcript JSONL for context usage, applies scaling to match /context
 */

import { execSync } from "child_process";
import { basename } from "path";
import { readFileSync, existsSync } from "fs";

// ============================================================================
// CONFIGURATION - Edit these values to match your Claude Code settings
// ============================================================================

// Set to true if autocompact mode is enabled in Claude Code
// Check with /context - if you see "Autocompact buffer" line, set to true
const AUTOCOMPACT_ENABLED = true;

// ============================================================================

interface ClaudeInput {
  session_id?: string;
  transcript_path?: string;
  model?: { id?: string };
  workspace?: { project_dir?: string };
  cost?: { total_cost_usd?: number };
  context_window?: { context_window_size?: number };
  cwd?: string;
}

// Claude Code reserves ~22.5% of context window as autocompact buffer
const AUTOCOMPACT_BUFFER_RATIO = 0.225;

// Scaling factor to align transcript tokens with /context display
// Accounts for overhead in API reporting vs /context breakdown
const TRANSCRIPT_SCALE_FACTOR = AUTOCOMPACT_ENABLED ? 0.83 : 1.0;

interface UsageData {
  input_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens?: number;
}

function readStdin(): ClaudeInput | null {
  try {
    const input = readFileSync(0, "utf-8").trim();
    if (input) return JSON.parse(input);
  } catch {}
  return null;
}

function exec(cmd: string, timeout = 3000): string {
  try {
    return execSync(cmd, {
      encoding: "utf-8",
      timeout,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    }).trim();
  } catch {
    return "";
  }
}

function getGitBranch(): string {
  return exec("git branch --show-current") || "";
}

function getGitStatus(): string {
  const status = exec("git status --porcelain");
  if (!status) return "";

  const lines = status.split("\n").filter(Boolean);
  const modified = lines.filter((l) => /^.M|^M/.test(l)).length;
  const untracked = lines.filter((l) => l.startsWith("??")).length;
  const staged = lines.filter((l) => /^[MADRC]/.test(l)).length;

  const parts: string[] = [];
  if (staged > 0) parts.push(`●${staged}`);
  if (modified > 0) parts.push(`~${modified}`);
  if (untracked > 0) parts.push(`+${untracked}`);

  return parts.length > 0 ? ` [${parts.join(" ")}]` : "";
}

function getModelFromInput(input: ClaudeInput | null): string {
  const modelId = input?.model?.id || "";
  if (modelId.includes("opus")) return "opus";
  if (modelId.includes("sonnet")) return "sonnet";
  if (modelId.includes("haiku")) return "haiku";
  return "opus";
}

function getProjectFromInput(input: ClaudeInput | null): string {
  const dir = input?.workspace?.project_dir || input?.cwd || process.cwd();
  return basename(dir);
}

function formatCost(cost: number | undefined): string {
  if (cost === undefined || cost === null) return "$0.00";
  return `$${cost.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1000000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1000000).toFixed(1)}M`;
}

/**
 * Parse JSONL transcript to get token usage
 */
function getTranscriptTokens(transcriptPath: string | undefined): number | null {
  if (!transcriptPath || !existsSync(transcriptPath)) return null;

  try {
    const content = readFileSync(transcriptPath, "utf-8");
    const lines = content.trim().split("\n");

    // Find the last assistant message with usage data
    let lastUsage: UsageData | null = null;

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);
        if (entry.message?.usage) {
          lastUsage = entry.message.usage;
          break;
        }
      } catch {}
    }

    if (!lastUsage) return null;

    // cache_read + input_tokens (excluding cache_creation)
    const transcriptTokens =
      (lastUsage.cache_read_input_tokens || 0) +
      (lastUsage.input_tokens || 0);

    return transcriptTokens;
  } catch {
    return null;
  }
}

function getContextPercent(input: ClaudeInput | null): { used: number; tokens: string } | null {
  const windowSize = input?.context_window?.context_window_size || 200000;

  const transcriptTokens = getTranscriptTokens(input?.transcript_path);

  if (transcriptTokens === null) return null;

  // Apply scaling factor to match /context display
  const scaledTokens = Math.floor(transcriptTokens * TRANSCRIPT_SCALE_FACTOR);

  // Add autocompact buffer only if enabled
  const autocompactBuffer = AUTOCOMPACT_ENABLED
    ? Math.floor(windowSize * AUTOCOMPACT_BUFFER_RATIO)
    : 0;
  const totalUsed = scaledTokens + autocompactBuffer;

  const usedPct = Math.round((totalUsed / windowSize) * 100);

  return {
    used: usedPct,
    tokens: formatTokens(totalUsed),
  };
}

function main() {
  const input = readStdin();

  const model = getModelFromInput(input);
  const branch = getGitBranch();
  const gitStatus = getGitStatus();
  const project = getProjectFromInput(input);
  const cost = input?.cost?.total_cost_usd;
  const context = getContextPercent(input);

  const modelEmoji: Record<string, string> = {
    opus: "🟣",
    sonnet: "🟠",
    haiku: "🟢",
  };

  const parts: string[] = [];

  // Model
  parts.push(`${modelEmoji[model] || "⚪"} ${model}`);

  // Git branch + status
  if (branch) {
    parts.push(`⎇ ${branch}${gitStatus}`);
  }

  // Project name
  parts.push(`📁 ${project}`);

  // Context usage (scaled to match /context)
  if (context) {
    parts.push(`📐 ${context.used}%`);
    parts.push(`📊 ${context.tokens}`);
  }

  // Session cost
  parts.push(`💰 ${formatCost(cost)}`);

  console.log(parts.join(" │ "));
}

main();
