import { selectCopyableMetadata } from "./metadata";
import type {
  CreateChartInput,
  DatawrapperChart,
  DuplicateChartResult,
  ListChartsInput,
} from "./types";

type FetchLike = typeof fetch;

export class DatawrapperApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details: unknown,
  ) {
    super(message);
    this.name = "DatawrapperApiError";
  }
}

export class DatawrapperClient {
  private readonly baseUrl: string;

  constructor(
    private readonly token: string,
    baseUrl = "https://api.datawrapper.de/v3",
    private readonly fetchImpl: FetchLike = fetch,
  ) {
    if (!token.trim()) {
      throw new Error("DATAWRAPPER_API_TOKEN is not configured.");
    }
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  static fromEnv(): DatawrapperClient {
    return new DatawrapperClient(
      process.env.DATAWRAPPER_API_TOKEN ?? "",
      process.env.DATAWRAPPER_API_BASE_URL ??
        "https://api.datawrapper.de/v3",
    );
  }

  private async request(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.token}`);
    headers.set("Accept", "application/json, text/plain;q=0.9");

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: init.signal ?? controller.signal,
      });

      if (!response.ok) {
        const raw = await response.text();
        let details: unknown = raw;
        try {
          details = raw ? JSON.parse(raw) : undefined;
        } catch {
          // Keep the upstream text body.
        }

        throw new DatawrapperApiError(
          `Datawrapper API request failed with HTTP ${response.status}.`,
          response.status,
          details,
        );
      }

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async requestJson<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const response = await this.request(path, init);
    const text = await response.text();
    return (text ? JSON.parse(text) : {}) as T;
  }

  async listCharts(input: ListChartsInput = {}): Promise<unknown> {
    const params = new URLSearchParams({
      limit: String(input.limit ?? 20),
      offset: String(input.offset ?? 0),
    });

    return this.requestJson(`/charts?${params.toString()}`);
  }

  async getChart(chartId: string): Promise<DatawrapperChart> {
    return this.requestJson(`/charts/${encodeURIComponent(chartId)}`);
  }

  async getChartData(chartId: string): Promise<string> {
    const response = await this.request(
      `/charts/${encodeURIComponent(chartId)}/data`,
      { headers: { Accept: "text/csv, text/plain" } },
    );
    return response.text();
  }

  async createChart(input: CreateChartInput): Promise<DatawrapperChart> {
    return this.requestJson("/charts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  async replaceChartData(chartId: string, csv: string): Promise<void> {
    await this.request(`/charts/${encodeURIComponent(chartId)}/data`, {
      method: "PUT",
      headers: { "Content-Type": "text/csv; charset=utf-8" },
      body: csv,
    });
  }

  async updateChart(
    chartId: string,
    patch: Record<string, unknown>,
  ): Promise<DatawrapperChart> {
    return this.requestJson(`/charts/${encodeURIComponent(chartId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async publishChart(chartId: string): Promise<unknown> {
    return this.requestJson(
      `/charts/${encodeURIComponent(chartId)}/publish`,
      { method: "POST" },
    );
  }

  async duplicateChart(
    chartId: string,
    requestedTitle?: string,
  ): Promise<DuplicateChartResult> {
    const source = await this.getChart(chartId);
    const data = await this.getChartData(chartId);

    if (!source.type) {
      throw new Error(
        `Source chart ${chartId} does not expose a visualization type.`,
      );
    }

    const created = await this.createChart({
      title: requestedTitle ?? `${source.title ?? "Untitled chart"} (copy)`,
      type: source.type,
      ...(source.theme ? { theme: source.theme } : {}),
      ...(typeof source.folderId === "number"
        ? { folderId: source.folderId }
        : {}),
    });

    await this.replaceChartData(created.id, data);

    const metadata = selectCopyableMetadata(source.metadata);
    if (metadata) {
      await this.updateChart(created.id, { metadata });
    }

    return { chart: await this.getChart(created.id), sourceChartId: chartId };
  }
}
