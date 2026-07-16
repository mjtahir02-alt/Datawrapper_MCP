import assert from "node:assert/strict";
import test from "node:test";

import {
  DatawrapperApiError,
  DatawrapperClient,
} from "../lib/datawrapper/client";

test("listCharts sends bearer authentication and bounded query parameters", async () => {
  let capturedUrl = "";
  let capturedAuthorization = "";

  const fakeFetch: typeof fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedAuthorization = new Headers(init?.headers).get(
      "authorization",
    ) ?? "";
    return Response.json({ list: [] });
  };

  const client = new DatawrapperClient(
    "token-123",
    "https://api.example.test/v3/",
    fakeFetch,
  );

  assert.deepEqual(await client.listCharts({ limit: 15, offset: 30 }), {
    list: [],
  });
  assert.equal(
    capturedUrl,
    "https://api.example.test/v3/charts?limit=15&offset=30",
  );
  assert.equal(capturedAuthorization, "Bearer token-123");
});

test("getChartData returns upstream CSV text", async () => {
  const fakeFetch: typeof fetch = async () =>
    new Response("label,value\nA,1", {
      status: 200,
      headers: { "Content-Type": "text/csv" },
    });

  const client = new DatawrapperClient(
    "token-123",
    "https://api.example.test/v3",
    fakeFetch,
  );

  assert.equal(
    await client.getChartData("abc12"),
    "label,value\nA,1",
  );
});

test("upstream failures become DatawrapperApiError without token leakage", async () => {
  const fakeFetch: typeof fetch = async () =>
    Response.json(
      { message: "Chart not found" },
      { status: 404 },
    );

  const client = new DatawrapperClient(
    "token-secret",
    "https://api.example.test/v3",
    fakeFetch,
  );

  await assert.rejects(
    () => client.getChart("missing"),
    (error: unknown) => {
      assert.ok(error instanceof DatawrapperApiError);
      assert.equal(error.status, 404);
      assert.deepEqual(error.details, { message: "Chart not found" });
      assert.doesNotMatch(error.message, /token-secret/);
      return true;
    },
  );
});
