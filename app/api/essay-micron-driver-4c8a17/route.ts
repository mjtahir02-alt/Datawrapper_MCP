import { DatawrapperClient } from "@/lib/datawrapper/client";
import { buildChartPatch } from "@/lib/datawrapper/metadata";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const api = DatawrapperClient.fromEnv();
    const chart = await api.createChart({
      title: "Micron's latest DRAM growth was driven far more by price than volume",
      type: "d3-bars",
    });

    const csv = [
      "Driver,Approximate year-over-year change (%)",
      "Average selling price,260",
      "Bit shipments,20",
    ].join("\n");

    await api.replaceChartData(chart.id, csv);
    await api.updateChart(
      chart.id,
      buildChartPatch({
        title: "Micron's latest DRAM growth was driven far more by price than volume",
        description:
          "Approximate year-over-year changes in Micron's fiscal third quarter of 2026. DRAM average selling prices increased in the low-260% range, while bit shipments increased in the low-20% range.",
        byline: "Muhammad Tahir",
        sourceName: "Micron fiscal Q3 2026 Form 10-Q",
        sourceUrl:
          "https://www.sec.gov/Archives/edgar/data/723125/000072312526000015/mu-20260528.htm",
        notes:
          "Values are rounded representations of company-disclosed ranges and should not be added together; price and volume interact multiplicatively in revenue growth.",
      }),
    );
    await api.publishChart(chart.id);
    const hydrated = await api.getChart(chart.id);

    return Response.json(
      {
        id: hydrated.id,
        title: hydrated.title,
        publicUrl: hydrated.publicUrl,
        editorUrl: `https://app.datawrapper.de/chart/${hydrated.id}/visualize`,
      },
      { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
