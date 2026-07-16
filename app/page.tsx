const tools = [
  "list_charts",
  "get_chart",
  "create_chart",
  "update_chart_data",
  "update_chart_metadata",
  "publish_chart",
  "duplicate_chart",
];

export default function Home() {
  return (
    <main>
      <section>
        <p className="eyebrow">Remote Model Context Protocol server</p>
        <h1>Datawrapper MCP</h1>
        <p className="lede">
          Create, update, duplicate, inspect, and publish Datawrapper
          charts through any compatible MCP client.
        </p>

        <div className="endpoint">
          <span>MCP endpoint</span>
          <code>/api/mcp</code>
        </div>

        <h2>Available tools</h2>
        <ul>
          {tools.map((tool) => (
            <li key={tool}>
              <code>{tool}</code>
            </li>
          ))}
        </ul>

        <p className="footnote">
          Check <code>/api/health</code> to confirm that the deployment is
          running and whether required environment variables are configured.
        </p>
      </section>
    </main>
  );
}
