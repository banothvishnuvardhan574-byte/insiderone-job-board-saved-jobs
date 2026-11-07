import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server.js";

test("saved jobs API lists, saves once, and removes jobs", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "job-board-saved-"));
  const savedPath = join(directory, "saved.json");
  const app = createApp({ savedPath });
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  const { port } = app.address();

  t.after(async () => {
    await new Promise((resolve, reject) => app.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  const getSaved = () => fetch(`${baseUrl}/api/saved`);

  let response = await getSaved();
  assert.deepEqual(await response.json(), []);

  response = await fetch(`${baseUrl}/api/saved`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: "j1" })
  });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).savedIds, ["j1"]);

  response = await fetch(`${baseUrl}/api/saved`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: "j1" })
  });
  assert.deepEqual((await response.json()).savedIds, ["j1"]);

  response = await getSaved();
  assert.deepEqual((await response.json()).map((job) => job.id), ["j1"]);

  response = await fetch(`${baseUrl}/api/saved`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: "unknown" })
  });
  assert.equal(response.status, 404);

  response = await fetch(`${baseUrl}/api/saved/j1`, { method: "DELETE" });
  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(await readFile(savedPath, "utf8")), []);

  response = await getSaved();
  assert.deepEqual(await response.json(), []);
});

test("saved jobs API rejects an invalid save request", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "job-board-saved-"));
  const app = createApp({ savedPath: join(directory, "saved.json") });
  await new Promise((resolve) => app.listen(0, "127.0.0.1", resolve));
  const { port } = app.address();

  t.after(async () => {
    await new Promise((resolve, reject) => app.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  });

  const response = await fetch(`http://127.0.0.1:${port}/api/saved`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobId: " " })
  });
  assert.equal(response.status, 400);
});