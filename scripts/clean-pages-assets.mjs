import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docs = path.join(root, "docs");
const generatedPaths = [
  "assets",
  "wasm",
  "index.html",
  "404.html",
  "favicon.svg",
  "manifest.webmanifest",
  "sw.js",
  ".nojekyll"
];

await Promise.all(
  generatedPaths.map((entry) => rm(path.join(docs, entry), { recursive: true, force: true }))
);
