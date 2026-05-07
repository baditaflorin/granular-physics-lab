import { copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await copyFile(path.join(root, "docs", "index.html"), path.join(root, "docs", "404.html"));
await writeFile(path.join(root, "docs", ".nojekyll"), "");
