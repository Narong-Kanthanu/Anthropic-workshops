# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Important**: Update this file whenever a solution is accepted to keep documentation current.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in a chat interface, Claude generates them using tools, and the result renders in real-time. Components are stored in a virtual file system (no disk writes).

## Commands

```bash
npm run setup          # Install deps, generate Prisma client, run migrations
npm run dev            # Development server with Turbopack (localhost:3000)
npm run build          # Production build
npm test               # Run Vitest tests
npm run lint           # ESLint
npm run db:reset       # Reset database
```

## Architecture

### Core Flow
1. User sends message → `POST /api/chat` (src/app/api/chat/route.ts)
2. API loads system prompt, reconstructs VirtualFileSystem from serialized data
3. Claude (or MockLanguageModel without API key) generates components using tools
4. Streams response back; saves project to DB for authenticated users
5. PreviewFrame renders App.jsx; CodeEditor shows generated files

### Key Abstractions

**VirtualFileSystem** (`src/lib/file-system.ts`): In-memory file system for generated components. All paths use "/" root. Methods: `createFile()`, `readFile()`, `replaceInFile()`, `serialize()`/`deserializeFromNodes()`.

**Language Model Provider** (`src/lib/provider.ts`): Returns Claude Haiku 4.5 when `ANTHROPIC_API_KEY` is set, otherwise returns MockLanguageModel for demo mode. Mock provider uses static templates and limits to 4 steps.

**Tools for Claude**:
- `str_replace_editor` (`src/lib/tools/str-replace.ts`): Create/edit files with str_replace commands
- `file_manager` (`src/lib/tools/file-manager.ts`): File operations

**ToolInvocationBadge** (`src/components/chat/ToolInvocationBadge.tsx`): Displays user-friendly messages for tool calls (e.g., "Creating /App.jsx" instead of "str_replace_editor"). Uses `getToolDisplayMessage()` helper for message generation.

### System Prompt Rules (`src/lib/prompts/generation.tsx`)
- Every project must have `/App.jsx` as root
- Use Tailwind CSS, not hardcoded styles
- Import non-library files with `@/` alias (e.g., `@/components/Button`)
- No HTML files - App.jsx is the entrypoint

### Database (Prisma + SQLite)
Schema defined in `prisma/schema.prisma` - reference this file to understand data structure.
- **User**: email, password (bcrypt hashed)
- **Project**: name, messages (JSON string), data (serialized VirtualFileSystem)
- Anonymous users can use the app; only authenticated users can persist projects

### Authentication
- JWT sessions (7-day expiry) via `src/lib/auth.ts`
- Server actions in `src/actions/` for sign-up/sign-in

## Testing

- Vitest config: `vitest.config.mts`
- Tests use `@vitest-environment node` directive for files needing Node APIs (e.g., jose JWT library)

## Code Style

- Use comments sparingly. Only comment complex code.

## Environment Variables

- `ANTHROPIC_API_KEY` (optional): Enables real Claude responses; without it, mock mode returns static components
- `JWT_SECRET` (optional): Defaults to "development-secret-key"
