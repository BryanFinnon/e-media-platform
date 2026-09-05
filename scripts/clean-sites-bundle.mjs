import { rm } from "node:fs/promises";

await rm(".sites-worker", { recursive: true, force: true });
