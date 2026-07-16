import assert from "node:assert/strict";
import test from "node:test";

import { rowsToCsv } from "../lib/datawrapper/csv";

test("rowsToCsv creates a header and preserves column order", () => {
  assert.equal(
    rowsToCsv([
      { country: "UAE", value: 10 },
      { country: "UK", value: 20, note: "estimate" },
    ]),
    "country,value,note\nUAE,10,\nUK,20,estimate",
  );
});

test("rowsToCsv escapes commas, quotes, and newlines", () => {
  assert.equal(
    rowsToCsv([{ label: 'A, "quoted"\nlabel', value: null }]),
    'label,value\n"A, ""quoted""\nlabel",',
  );
});

test("rowsToCsv rejects an empty array", () => {
  assert.throws(
    () => rowsToCsv([]),
    /At least one data row is required/,
  );
});
