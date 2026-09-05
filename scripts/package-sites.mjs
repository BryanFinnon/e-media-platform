import { cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";

const source = path.resolve(".sites-worker");
const destination = path.resolve("dist");
const entryCandidates = ["index.js", "worker.js"];
let entryFile;

for (const candidate of entryCandidates) {
  try {
    await stat(path.join(source, candidate));
    entryFile = candidate;
    break;
  } catch {
    // Try the next Wrangler output filename.
  }
}

if (!entryFile) {
  throw new Error("Wrangler did not produce a Worker entrypoint.");
}

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });

const serverDirectory = path.join(destination, "server");
await cp(source, serverDirectory, { recursive: true, dereference: true });
if (entryFile !== "index.js") {
  await cp(
    path.join(serverDirectory, entryFile),
    path.join(serverDirectory, "index.js"),
  );
}

await cp(path.resolve(".open-next", "assets"), path.join(destination, "assets"), {
  recursive: true,
  dereference: true,
});

const metadataDirectory = path.join(destination, ".openai");
await mkdir(metadataDirectory, { recursive: true });
await cp(
  path.resolve(".openai", "hosting.json"),
  path.join(metadataDirectory, "hosting.json"),
);

try {
  await cp(path.resolve("drizzle"), path.join(metadataDirectory, "drizzle"), {
    recursive: true,
  });
} catch (error) {
  if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") {
    throw error;
  }
}
