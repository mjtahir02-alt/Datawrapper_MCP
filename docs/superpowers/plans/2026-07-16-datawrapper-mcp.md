# Datawrapper MCP Implementation Plan

**Goal:** Deploy a remote MCP server that exposes focused Datawrapper chart-management tools.

**Architecture:** A Next.js route uses Vercel's `mcp-handler` adapter for Streamable HTTP. A separately testable Datawrapper client owns all API calls, while CSV and metadata modules handle deterministic transformations.

**Tech Stack:** Next.js 15, TypeScript 5, `mcp-handler` 1.x, Zod 3, Node test runner through `tsx`, Vercel Functions.

## Tasks

- [x] Add deterministic CSV and metadata transformations with tests.
- [x] Add the Datawrapper API client with bearer authentication, timeout handling, and sanitized upstream errors.
- [x] Expose seven MCP tools at `/api/mcp`.
- [x] Add optional MCP bearer protection through `MCP_ACCESS_TOKEN`.
- [x] Add `/api/health`, a landing page, and deployment documentation.
- [ ] Complete the Vercel production build.
- [ ] Configure `DATAWRAPPER_API_TOKEN` in Vercel.
- [ ] Validate `/api/health` and MCP tool discovery.
