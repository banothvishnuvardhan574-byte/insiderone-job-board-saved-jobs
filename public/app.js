const list = document.getElementById("jobs");
const search = document.getElementById("search");
const savedList = document.getElementById("saved-jobs");
const status = document.getElementById("status");
let savedJobs = [];

async function request(path, options) {
  const response = await fetch(path, options);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Request failed");
  }

  return body;
}

function showError(error) {
  status.textContent = error.message;
}

function renderJobs(jobs) {
  list.innerHTML = "";
  const savedIds = new Set(savedJobs.map(job => job.id));

  for (const job of jobs) {
    const li = document.createElement("li");
    const details = document.createElement("p");
    details.textContent = `${job.title} at ${job.company}, ${job.location}. Rs ${job.stipend.toLocaleString("en-IN")} a month.`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = savedIds.has(job.id) ? "Saved" : "Save";
    button.disabled = savedIds.has(job.id);
    button.addEventListener("click", async () => {
      try {
        await request("/api/saved", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jobId: job.id })
        });
        await refresh();
        status.textContent = `Saved ${job.title}.`;
      } catch (error) {
        showError(error);
      }
    });
    li.append(details, button);
    list.append(li);
  }
}

function renderSavedJobs() {
  savedList.replaceChildren();

  for (const job of savedJobs) {
    const li = document.createElement("li");
    const details = document.createElement("p");
    details.textContent = `${job.title} at ${job.company}, ${job.location}. Rs ${job.stipend.toLocaleString("en-IN")} a month.`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Remove";
    button.addEventListener("click", async () => {
      try {
        await request(`/api/saved/${encodeURIComponent(job.id)}`, {
          method: "DELETE"
        });
        await refresh();
        status.textContent = `Removed ${job.title}.`;
      } catch (error) {
        showError(error);
      }
    });
    li.append(details, button);
    savedList.append(li);
  }
}

async function refresh(query = search.value) {
  const [jobs, currentSavedJobs] = await Promise.all([
    request(`/api/jobs?q=${encodeURIComponent(query)}`),
    request("/api/saved")
  ]);
  savedJobs = currentSavedJobs;
  renderJobs(jobs);
  renderSavedJobs();
}

search.addEventListener("input", () => refresh(search.value).catch(showError));
refresh().catch(showError);
