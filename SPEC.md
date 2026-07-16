# Datawrapper MCP Server Specification

## Objective

Build a remote Model Context Protocol server that lets MCP-compatible AI clients create, inspect, update, duplicate, and publish Datawrapper charts through Datawrapper API v3.

## Deployment

- Source repository: `mjtahir02-alt/Datawrapper_MCP`
- Runtime: Next.js on Vercel
- MCP transport: Streamable HTTP
- MCP endpoint: `/api/mcp`
- Health endpoint: `/api/health`
- Datawrapper API base URL: `https://api.datawrapper.de/v3`

## Authentication

- `DATAWRAPPER_API_TOKEN` is mandatory for Datawrapper operations.
- `MCP_ACCESS_TOKEN` is optional. When set, all MCP requests must send `Authorization: Bearer <token>`.
- Secrets must only be read from environment variables and must never appear in responses, logs, source control, or health checks.

## MCP Tools

1. `list_charts`
   - Lists charts using bounded pagination.
2. `get_chart`
   - Retrieves one chart and returns editor and public links where available.
3. `create_chart`
   - Creates a chart.
   - Optionally uploads CSV data or converts structured rows to CSV.
4. `update_chart_data`
   - Replaces chart data using CSV or structured rows.
5. `update_chart_metadata`
   - Updates title, description, byline, source attribution, and notes.
6. `publish_chart`
   - Publishes or republishes a chart.
7. `duplicate_chart`
   - Copies chart configuration and data into a new unpublished chart.

## Functional Requirements

- Validate all MCP inputs with Zod.
- Use the Datawrapper bearer token on every upstream request.
- Preserve upstream HTTP status and useful error details without leaking secrets.
- Accept either raw CSV or structured rows for data-writing tools.
- Reject ambiguous data requests that supply both CSV and rows.
- Return concise text plus JSON for reliable use across MCP clients.
- Never delete charts in the initial release.
- Do not automatically publish newly created or duplicated charts.

## Reliability

- Default request timeout: 30 seconds.
- Pagination limit: 1 to 100.
- MCP function duration: 60 seconds.
- SSE is disabled; Streamable HTTP is the supported remote transport.
- Health checks report configuration state only, never secret values.

## Testing

- Unit tests cover CSV generation and escaping.
- Unit tests cover metadata patch construction.
- Unit tests cover Datawrapper request URLs, authorization headers, and upstream error handling.
- Production validation requires a successful Vercel build and health endpoint response.

## GitHub governance

- GitHub is the source of truth for code, specifications, and change history.
- Vercel remains the production runtime and continues to deploy from `main`.
- All changes should be developed on separate branches and submitted through pull requests.
- Pull requests must pass installation, tests, type checking, and production build validation before merge.
- Preview deployments should be validated before production changes are merged.
- Routine repository maintenance must not change MCP endpoints, tool contracts, authentication, environment variables, Vercel project linkage, or chart publishing behavior.
