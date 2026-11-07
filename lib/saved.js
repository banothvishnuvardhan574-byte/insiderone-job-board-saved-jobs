import { readFile, writeFile } from "node:fs/promises";

let writeQueue = Promise.resolve();

export async function loadSavedIds(path = new URL("../saved.json", import.meta.url)) {
  try {
    const data = await readFile(path, "utf8");
    const ids = JSON.parse(data);

    if (!Array.isArray(ids)) {
      throw new Error("Saved jobs file must contain an array");
    }

    return ids;
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export function updateSavedIds(update, path = new URL("../saved.json", import.meta.url)) {
  const operation = writeQueue.then(async () => {
    const ids = await loadSavedIds(path);
    const updatedIds = update(ids);

    await writeFile(path, JSON.stringify(updatedIds, null, 2));
    return updatedIds;
  });

  writeQueue = operation.catch(() => {});
  return operation;
}