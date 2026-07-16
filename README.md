# Datawrapper MCP

A remote Model Context Protocol server for creating and managing Datawrapper visualizations.

## What it does

The server exposes seven tools:

| Tool | Purpose |
|---|---|
| `list_charts` | List charts with pagination |
| `get_chart` | Retrieve chart configuration and links |
| `create_chart` | Create a chart and optionally upload data |
| `update_chart_data` | Replace data using CSV or structured rows |
| `update_chart_metadata` | Update title, description, byline, source, and notes |
| `publish_chart` | Publish or republish a chart |
| `duplicate_chart` | Create an unpublished copy of a chart |

No delete tool is included.

## Architecture

- Next.js App Router
- Vercel `mcp-handler`
- Streamable HTTP transport
- Datawrapper API v3
- MCP endpoint: `/api/mcp`
- Health endpoint: `/api/health`

## Environment variables

Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
|---|---:|---|
| `DATAWRAPPER_API_TOKEN` | Yes | Personal Datawrapper API token |
| `MCP_ACCESS_TOKEN` | No | Requires the same bearer token on MCP requests |
| `DATAWRAPPER_API_BASE_URL` | No | Defaults to `https://api.datawrapper.de/v3` |

Create the Datawrapper token in the Datawrapper account settings. For the complete toolset, grant `chart:read` and `chart:write`. Grant folder permissions only when creating charts inside folders.

Never commit real tokens.

## Local development

```bash
npm install
npm test
npm run typecheck
npm run dev
```

The MCP endpoint will be:

```text
http://localhost:3000/api/mcp
```

The health check will be:

```text
http://localhost:3000/api/health
```

Test the server using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector@latest
```

Select **Streamable HTTP** and connect to `http://localhost:3000/api/mcp`.

## Deploy to Vercel

1. Import this GitHub repository into Vercel.
2. Add `DATAWRAPPER_API_TOKEN` to Production, Preview, and Development as needed.
3. Optionally add `MCP_ACCESS_TOKEN`.
4. Deploy.
5. Open `/api/health`.
6. Connect an MCP client to `https://<deployment-domain>/api/mcp`.

## MCP client configuration

For clients that accept a Streamable HTTP URL:

```json
{
  "mcpServers": {
    "datawrapper": {
      "url": "https://<deployment-domain>/api/mcp"
    }
  }
}
```

When `MCP_ACCESS_TOKEN` is configured, the client must support sending:

```text
Authorization: Bearer <MCP_ACCESS_TOKEN>
```

Some hosted chat clients require OAuth rather than a static header. In that case, add an OAuth authorization layer before using this server with sensitive production data.

## Example requests

Create a chart from structured rows:

```json
{
  "title": "Revenue by market",
  "type": "d3-bars",
  "rows": [
    { "Market": "UAE", "Revenue": 120 },
    { "Market": "UK", "Revenue": 85 }
  ]
}
```

Update attribution:

```json
{
  "chartId": "abc12",
  "sourceName": "Company filings",
  "sourceUrl": "https://example.com/source",
  "byline": "Strategy team"
}
```

## Security notes

- Datawrapper credentials remain server-side.
- Health checks disclose only whether variables are configured.
- Upstream errors are sanitized and never include the API token.
- Publishing is an explicit separate tool.
- New and duplicated charts remain unpublished until `publish_chart` is called.

## License

MIT
