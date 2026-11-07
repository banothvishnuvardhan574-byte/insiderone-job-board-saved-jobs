# Job board starter

A small job board for an insiderOne work sample. It is made up: the jobs and
companies are not real.

## Run it

You need Node 20 or newer. There are no packages to install.

```
npm start      # then open http://localhost:3000
npm test       # runs the tests in test/
```

## What is here

- `server.js`: the web server and JSON API.
- `lib/jobs.js`: reading, searching, and finding jobs.
- `lib/saved.js`: loading and updating saved job IDs with serialized writes.
- `jobs.json`: the jobs.
- `saved.json`: persisted saved job IDs.
- `public/`: the page and its script, including Save and Remove controls.
- `test/`: tests using Node's built-in test runner.

## API

- `GET /api/jobs?q=` lists jobs, optionally filtered by title, company, or location.
- `GET /api/saved` lists saved job details.
- `POST /api/saved` saves a job. Send JSON such as `{"jobId":"j1"}`.
- `DELETE /api/saved/:jobId` removes a saved job.

Saved IDs are stored in `saved.json`. Writes are serialized within one server
process; this file-backed approach is intended for a small assignment, not a
multi-server production deployment.

## AI use

GitHub Copilot was used to help implement the saved-job storage, API, interface,
tests, and documentation. The project was run and the backend API was manually
verified locally.
