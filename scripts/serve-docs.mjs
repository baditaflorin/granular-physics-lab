import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = path.join(root, "docs");
const port = Number(process.argv[2] ?? "4173");
const base = "/granular-physics-lab";

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"],
  [".webmanifest", "application/manifest+json; charset=utf-8"]
]);

function safePath(urlPath) {
  const stripped = urlPath.startsWith(base) ? urlPath.slice(base.length) || "/" : urlPath;
  const decoded = decodeURIComponent(stripped.split("?")[0] ?? "/");
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return path.join(docsRoot, normalized === "/" ? "index.html" : normalized);
}

const server = createServer(async (request, response) => {
  try {
    const requestedPath = safePath(request.url ?? "/");
    const fileStat = await stat(requestedPath).catch(() => null);
    const filePath = fileStat?.isFile() ? requestedPath : path.join(docsRoot, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": types.get(path.extname(filePath)) ?? "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(body);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : "server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Serving docs at http://127.0.0.1:${port}${base}/\n`);
});
