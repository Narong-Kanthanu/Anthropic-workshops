"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  args?: unknown;
  state: string;
  result?: unknown;
}

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function parseArgs(args: unknown): Record<string, unknown> | undefined {
  if (!args) return undefined;
  if (typeof args === "string") {
    try {
      return JSON.parse(args);
    } catch {
      return undefined;
    }
  }
  if (typeof args === "object") {
    return args as Record<string, unknown>;
  }
  return undefined;
}

export function getToolDisplayMessage(
  toolName: string,
  rawArgs?: unknown
): string {
  const args = parseArgs(rawArgs);
  if (!args) return toolName;

  const command = args.command as string | undefined;
  const path = args.path as string | undefined;

  if (toolName === "str_replace_editor") {
    if (!path) return toolName;
    switch (command) {
      case "create":
        return `Creating ${path}`;
      case "str_replace":
      case "insert":
        return `Editing ${path}`;
      case "view":
        return `Viewing ${path}`;
      default:
        return toolName;
    }
  }

  if (toolName === "file_manager") {
    if (!path) return toolName;
    const newPath = args.new_path as string | undefined;
    switch (command) {
      case "rename":
        return newPath ? `Renaming ${path} → ${newPath}` : `Renaming ${path}`;
      case "delete":
        return `Deleting ${path}`;
      default:
        return toolName;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({
  toolInvocation,
}: ToolInvocationBadgeProps) {
  const { toolName, args, state, result } = toolInvocation;
  const message = getToolDisplayMessage(toolName, args);
  const isComplete = state === "result" && result !== undefined;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{message}</span>
    </div>
  );
}
