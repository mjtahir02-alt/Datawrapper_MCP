export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json({
    status: "ok",
    service: "datawrapper-mcp",
    mcpEndpoint: "/api/mcp",
    datawrapperConfigured: Boolean(
      process.env.DATAWRAPPER_API_TOKEN?.trim(),
    ),
    mcpAccessTokenConfigured: Boolean(
      process.env.MCP_ACCESS_TOKEN?.trim(),
    ),
    timestamp: new Date().toISOString(),
  });
}
