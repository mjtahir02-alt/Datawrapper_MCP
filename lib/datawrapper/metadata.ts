import type { ChartMetadataInput } from "./types";

export function buildChartPatch(
  input: ChartMetadataInput,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  const describe: Record<string, string> = {};
  const annotate: Record<string, string> = {};

  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) describe.intro = input.description;
  if (input.byline !== undefined) describe.byline = input.byline;
  if (input.sourceName !== undefined) describe["source-name"] = input.sourceName;
  if (input.sourceUrl !== undefined) describe["source-url"] = input.sourceUrl;
  if (input.notes !== undefined) annotate.notes = input.notes;

  const metadata: Record<string, unknown> = {};
  if (Object.keys(describe).length > 0) metadata.describe = describe;
  if (Object.keys(annotate).length > 0) metadata.annotate = annotate;
  if (Object.keys(metadata).length > 0) patch.metadata = metadata;

  return patch;
}

export function selectCopyableMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const copyableKeys = ["data", "describe", "visualize", "annotate"];
  const selected: Record<string, unknown> = {};

  for (const key of copyableKeys) {
    if (metadata[key] !== undefined) {
      selected[key] = structuredClone(metadata[key]);
    }
  }

  return Object.keys(selected).length > 0 ? selected : undefined;
}
