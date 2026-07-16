import assert from "node:assert/strict";
import test from "node:test";

import {
  buildChartPatch,
  selectCopyableMetadata,
} from "../lib/datawrapper/metadata";

test("buildChartPatch nests description and source fields correctly", () => {
  assert.deepEqual(
    buildChartPatch({
      title: "New title",
      description: "Context",
      byline: "Analyst",
      sourceName: "Official source",
      sourceUrl: "https://example.com",
      notes: "A note",
    }),
    {
      title: "New title",
      metadata: {
        describe: {
          intro: "Context",
          byline: "Analyst",
          "source-name": "Official source",
          "source-url": "https://example.com",
        },
        annotate: { notes: "A note" },
      },
    },
  );
});

test("selectCopyableMetadata excludes publication metadata", () => {
  assert.deepEqual(
    selectCopyableMetadata({
      describe: { intro: "Copy me" },
      visualize: { thick: true },
      publish: { "embed-codes": { iframe: "secret-old-code" } },
      other: { ignored: true },
    }),
    {
      describe: { intro: "Copy me" },
      visualize: { thick: true },
    },
  );
});
