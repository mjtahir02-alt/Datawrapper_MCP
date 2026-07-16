import type { DatawrapperChart } from "./types";

export function normalizePublicUrl(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  if (value.startsWith("//")) return `https:${value}`;
  return value;
}

export function chartLinks(chart: DatawrapperChart): {
  editorUrl: string;
  publicUrl: string | null;
} {
  return {
    editorUrl: `https://app.datawrapper.de/chart/${encodeURIComponent(
      chart.id,
    )}/visualize`,
    publicUrl: normalizePublicUrl(chart.publicUrl),
  };
}

export function toolText(
  summary: string,
  data: unknown,
): {
  content: Array<{ type: "text"; text: string }>;
} {
  return {
    content: [
      {
        type: "text",
        text: `${summary}\n\n${JSON.stringify(data, null, 2)}`,
      },
    ],
  };
}

export function errorText(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  const safe =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          ...("status" in error &&
          typeof (error as { status?: unknown }).status === "number"
            ? { status: (error as { status: number }).status }
            : {}),
          ...("details" in error
            ? { details: (error as { details: unknown }).details }
            : {}),
        }
      : { message: String(error) };

  return {
    content: [
      {
        type: "text",
        text: `Datawrapper operation failed.\n\n${JSON.stringify(
          safe,
          null,
          2,
        )}`,
      },
    ],
    isError: true,
  };
}
