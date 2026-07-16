import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

import { DatawrapperClient } from "@/lib/datawrapper/client";
import { rowsToCsv } from "@/lib/datawrapper/csv";
import { buildChartPatch } from "@/lib/datawrapper/metadata";
import {
  chartLinks,
  errorText,
  toolText,
} from "@/lib/datawrapper/tool-result";

const primitive = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
const rowsSchema = z.array(z.record(primitive)).min(1).max(10_000);

const noAuthSecuritySchemes = [{ type: "noauth" as const }];
const noAuthMeta = { securitySchemes: noAuthSecuritySchemes };

function client(): DatawrapperClient {
  return DatawrapperClient.fromEnv();
}

function resolveCsv(input: {
  csv?: string;
  rows?: Array<Record<string, string | number | boolean | null>>;
}): string {
  const hasCsv = typeof input.csv === "string";
  const hasRows = Array.isArray(input.rows);

  if (hasCsv === hasRows) {
    throw new Error("Provide exactly one of csv or rows.");
  }

  return hasCsv ? input.csv! : rowsToCsv(input.rows!);
}

const handler = createMcpHandler(
  async (server) => {
    server.registerTool(
      "list_charts",
      {
        title: "List Datawrapper charts",
        description:
          "List Datawrapper charts with bounded pagination. Use this before selecting a chart by ID.",
        inputSchema: z.object({
          limit: z.number().int().min(1).max(100).default(20),
          offset: z.number().int().min(0).default(0),
        }),
        securitySchemes: noAuthSecuritySchemes,
        _meta: noAuthMeta,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: true,
        },
      },
      async ({ limit, offset }) => {
        try {
          const result = await client().listCharts({ limit, offset });
          return toolText("Datawrapper charts retrieved.", result);
        } catch (error) {
          return errorText(error);
        }
      },
    );

    server.registerTool(
      "get_chart",
      {
        title: "Get a Datawrapper chart",
        description:
          "Retrieve a chart's configuration, publication status, editor URL, and public URL.",
        inputSchema: z.object({
          chartId: z.string().min(1).max(64),
        }),
        securitySchemes: noAuthSecuritySchemes,
        _meta: noAuthMeta,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          openWorldHint: true,
        },
      },
      async ({ chartId }) => {
        try {
          const chart = await client().getChart(chartId);
          return toolText("Datawrapper chart retrieved.", {
            chart,
            links: chartLinks(chart),
          });
        } catch (error) {
          return errorText(error);
        }
      },
    );

    server.registerTool(
      "create_chart",
      {
        title: "Create a Datawrapper chart",
        description:
          "Create an unpublished Datawrapper chart and optionally upload data as CSV or structured rows.",
        inputSchema: z.object({
          title: z.string().min(1).max(300),
          type: z.string().min(1).max(100).default("d3-bars"),
          theme: z.string().min(1).max(100).optional(),
          folderId: z.number().int().positive().optional(),
          csv: z.string().min(1).optional(),
          rows: rowsSchema.optional(),
        }),
        securitySchemes: noAuthSecuritySchemes,
        _meta: noAuthMeta,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true,
          idempotentHint: false,
        },
      },
      async ({ title, type, theme, folderId, csv, rows }) => {
        try {
          if (csv !== undefined && rows !== undefined) {
            throw new Error("Provide csv or rows, not both.");
          }

          const api = client();
          const chart = await api.createChart({
            title,
            type,
            ...(theme ? { theme } : {}),
            ...(folderId ? { folderId } : {}),
          });

          if (csv !== undefined || rows !== undefined) {
            await api.replaceChartData(
              chart.id,
              resolveCsv({ csv, rows }),
            );
          }

          const hydrated = await api.getChart(chart.id);
          return toolText("Datawrapper chart created.", {
            chart: hydrated,
            links: chartLinks(hydrated),
          });
        } catch (error) {
          return errorText(error);
        }
      },
    );

    server.registerTool(
      "update_chart_data",
      {
        title: "Replace Datawrapper chart data",
        description:
          "Replace all data in an existing chart using either raw CSV or structured rows.",
        inputSchema: z.object({
          chartId: z.string().min(1).max(64),
          csv: z.string().min(1).optional(),
          rows: rowsSchema.optional(),
        }),
        securitySchemes: noAuthSecuritySchemes,
        _meta: noAuthMeta,
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          openWorldHint: true,
          idempotentHint: true,
        },
      },
      async ({ chartId, csv, rows }) => {
        try {
          const data = resolveCsv({ csv, rows });
          await client().replaceChartData(chartId, data);
          return toolText("Datawrapper chart data replaced.", {
            chartId,
            rowCount: data.split(/\r?\n/).length - 1,
          });
        } catch (error) {
          return errorText(error);
        }
      },
    );

    server.registerTool(
      "update_chart_metadata",
      {
        title: "Update Datawrapper chart metadata",
        description:
          "Update title, description, byline, source attribution, and annotation notes without replacing chart data.",
        inputSchema: z.object({
          chartId: z.string().min(1).max(64),
          title: z.string().max(300).optional(),
          description: z.string().max(5_000).optional(),
          byline: z.string().max(500).optional(),
          sourceName: z.string().max(500).optional(),
          sourceUrl: z.string().url().max(2_000).optional(),
          notes: z.string().max(5_000).optional(),
        }),
        securitySchemes: noAuthSecuritySchemes,
        _meta: noAuthMeta,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true,
          idempotentHint: true,
        },
      },
      async ({ chartId, ...metadata }) => {
        try {
          const patch = buildChartPatch(metadata);
          if (Object.keys(patch).length === 0) {
            throw new Error("Provide at least one metadata field to update.");
          }

          const chart = await client().updateChart(chartId, patch);
          return toolText("Datawrapper chart metadata updated.", {
            chart,
            links: chartLinks(chart),
          });
        } catch (error) {
          return errorText(error);
        }
      },
    );

    server.registerTool(
      "publish_chart",
      {
        title: "Publish a Datawrapper chart",
        description:
          "Publish or republish an existing Datawrapper chart. This makes the visualization publicly accessible.",
        inputSchema: z.object({
          chartId: z.string().min(1).max(64),
        }),
        securitySchemes: noAuthSecuritySchemes,
        _meta: noAuthMeta,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true,
          idempotentHint: true,
        },
      },
      async ({ chartId }) => {
        try {
          const publication = await client().publishChart(chartId);
          const chart = await client().getChart(chartId);
          return toolText("Datawrapper chart published.", {
            publication,
            chart,
            links: chartLinks(chart),
          });
        } catch (error) {
          return errorText(error);
        }
      },
    );

    server.registerTool(
      "duplicate_chart",
      {
        title: "Duplicate a Datawrapper chart",
        description:
          "Create a new unpublished chart by copying an existing chart's data and safe visualization metadata.",
        inputSchema: z.object({
          chartId: z.string().min(1).max(64),
          title: z.string().min(1).max(300).optional(),
        }),
        securitySchemes: noAuthSecuritySchemes,
        _meta: noAuthMeta,
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          openWorldHint: true,
          idempotentHint: false,
        },
      },
      async ({ chartId, title }) => {
        try {
          const result = await client().duplicateChart(chartId, title);
          return toolText("Datawrapper chart duplicated.", {
            ...result,
            links: chartLinks(result.chart),
          });
        } catch (error) {
          return errorText(error);
        }
      },
    );
  },
  {},
  {
    basePath: "/api",
    verboseLogs: false,
    maxDuration: 60,
    disableSse: true,
  },
);

async function protectedHandler(request: Request): Promise<Response> {
  const expected = process.env.MCP_ACCESS_TOKEN?.trim();

  if (expected) {
    const provided = request.headers.get("authorization");
    if (provided !== `Bearer ${expected}`) {
      return Response.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: { "WWW-Authenticate": 'Bearer realm="datawrapper-mcp"' },
        },
      );
    }
  }

  return handler(request);
}

export {
  protectedHandler as DELETE,
  protectedHandler as GET,
  protectedHandler as POST,
};