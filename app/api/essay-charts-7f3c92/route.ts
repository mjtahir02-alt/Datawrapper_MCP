import { DatawrapperClient } from "@/lib/datawrapper/client";
import { buildChartPatch } from "@/lib/datawrapper/metadata";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SOURCE_URL = "https://github.com/mjtahir02-alt/AI-Value-chain";

async function createAndPublish(input: {
  title: string;
  type: string;
  csv: string;
  description: string;
  notes: string;
}) {
  const api = DatawrapperClient.fromEnv();
  const created = await api.createChart({ title: input.title, type: input.type });
  await api.replaceChartData(created.id, input.csv);
  await api.updateChart(
    created.id,
    buildChartPatch({
      title: input.title,
      description: input.description,
      byline: "Muhammad Tahir",
      sourceName: "SEC filings compiled in The Toll Index",
      sourceUrl: SOURCE_URL,
      notes: input.notes,
    }),
  );
  await api.publishChart(created.id);
  return api.getChart(created.id);
}

export async function GET() {
  try {
    const trajectoryCsv = [
      "Year,NVIDIA index,Micron index",
      "2019,100.0,100.0",
      "2020,159.2,40.7",
      "2021,352.8,85.2",
      "2022,148.4,131.5",
      "2023,1158.5,-77.9",
      "2024,2862.0,17.7",
      "2025,4581.4,132.5",
    ].join("\n");

    const micronCsv = [
      "Year,Operating income ($bn)",
      "2019,7.376",
      "2020,3.003",
      "2021,6.283",
      "2022,9.702",
      "2023,-5.745",
      "2024,1.304",
      "2025,9.770",
    ].join("\n");

    const [trajectory, micron] = await Promise.all([
      createAndPublish({
        title: "The same AI boom produced two different profit patterns",
        type: "d3-lines",
        csv: trajectoryCsv,
        description:
          "Operating income indexed to 100 in 2019. NVIDIA compounds upward as a platform; Micron swings with the memory cycle.",
        notes:
          "Total-company operating income, not AI-attributed profit. Calendar mapping follows SEC XBRL frames. Indexed values calculated from filing figures in the AI-Value-chain repository.",
      }),
      createAndPublish({
        title: "Micron reached almost identical profit peaks in two different demand cycles",
        type: "d3-bars",
        csv: micronCsv,
        description:
          "Micron operating income was $9.702bn in 2022 and $9.770bn in 2025, with a $5.745bn loss between them.",
        notes:
          "Total-company operating income. The similarity of the peaks does not make demand irrelevant; it shows how strongly memory profits respond when demand, inventory and constrained capacity align.",
      }),
    ]);

    return Response.json(
      {
        charts: [
          {
            id: trajectory.id,
            title: trajectory.title,
            publicUrl: trajectory.publicUrl,
            editorUrl: `https://app.datawrapper.de/chart/${trajectory.id}/visualize`,
          },
          {
            id: micron.id,
            title: micron.title,
            publicUrl: micron.publicUrl,
            editorUrl: `https://app.datawrapper.de/chart/${micron.id}/visualize`,
          },
        ],
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
