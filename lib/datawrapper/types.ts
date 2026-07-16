export type Primitive = string | number | boolean | null;
export type DataRow = Record<string, Primitive>;

export interface DatawrapperChart {
  id: string;
  title?: string;
  type?: string;
  theme?: string;
  language?: string;
  folderId?: number | null;
  publicUrl?: string | null;
  publicVersion?: number;
  publishedAt?: string | null;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CreateChartInput {
  title: string;
  type: string;
  theme?: string;
  folderId?: number;
}

export interface ChartMetadataInput {
  title?: string;
  description?: string;
  byline?: string;
  sourceName?: string;
  sourceUrl?: string;
  notes?: string;
}

export interface ListChartsInput {
  limit?: number;
  offset?: number;
}

export interface DuplicateChartResult {
  chart: DatawrapperChart;
  sourceChartId: string;
}
