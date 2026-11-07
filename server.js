// A small job board: a JSON API and one page. Run with `npm start`.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { loadJobs, searchJobs, findJob } from "./lib/jobs.js";
import { loadSavedIds, updateSavedIds } from "./lib/saved.js";

const PORT = Number(process.env.PORT ?? 3000);

function sendJson(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;
  }

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export function createApp({ savedPath } = {}) {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");

      // Get all jobs
      if (req.method === "GET" && url.pathname === "/api/jobs") {
        const jobs = await loadJobs();
        return sendJson(res, 200, searchJobs(jobs, url.searchParams.get("q")));
      }

      // Get saved jobs
      if (req.method === "GET" && url.pathname === "/api/saved") {
        const jobs = await loadJobs();
        const ids = await loadSavedIds(savedPath);

        const savedJobs = ids
          .map(id => findJob(jobs, id))
          .filter(Boolean);

        return sendJson(res, 200, savedJobs);
      }

      // Save a job
      if (req.method === "POST" && url.pathname === "/api/saved") {
        const body = await readBody(req);

        if (!body || typeof body.jobId !== "string" || !body.jobId.trim()) {
          return sendJson(res, 400, {
            error: "A valid jobId is required"
          });
        }

        const jobs = await loadJobs();
        const job = findJob(jobs, body.jobId);

        if (!job) {
          return sendJson(res, 404, {
            error: "Job not found"
          });
        }

        const ids = await updateSavedIds(current =>
          current.includes(job.id)
            ? current
            : [...current, job.id],
          savedPath
        );

        return sendJson(res, 200, {
          message: "Job saved successfully",
          job,
          savedIds: ids
        });
      }

      // Remove a saved job
      const deleteMatch = url.pathname.match(/^\/api\/saved\/([^/]+)$/);

      if (req.method === "DELETE" && deleteMatch) {
        const jobId = decodeURIComponent(deleteMatch[1]);

        const jobs = await loadJobs();

        if (!findJob(jobs, jobId)) {
          return sendJson(res, 404, {
            error: "Job not found"
          });
        }

        const currentIds = await loadSavedIds(savedPath);

        if (!currentIds.includes(jobId)) {
          return sendJson(res, 404, {
            error: "Saved job not found"
          });
        }

        await updateSavedIds(
          ids => ids.filter(id => id !== jobId),
          savedPath
        );

        return sendJson(res, 200, {
          message: "Job removed successfully"
        });
      }

      // Serve frontend
      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/app.js")) {
        const file = url.pathname === "/" ? "index.html" : "app.js";
        const type = file.endsWith(".html") ? "text/html" : "text/javascript";
        const body = await readFile(new URL(`./public/${file}`, import.meta.url));
        res.writeHead(200, { "content-type": `${type}; charset=utf-8` });
        return res.end(body);
      }
      return sendJson(res, 404, { error: "Not found" });
    } catch (error) {
      console.error(error);

      if (!res.headersSent) {
        return sendJson(res, 500, { error: "Something went wrong" });
      }

      res.end();
    }
  });
}

// Started directly (npm start), not imported by a test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createApp().listen(PORT, () => console.log(`Job board on http://localhost:${PORT}`));
}
