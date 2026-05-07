import { mkdir, readFile, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = path.join(root, "src", "generated", "buildInfo.ts");

if (process.env.PRESERVE_BUILD_INFO === "1") {
  await readFile(outputPath, "utf8");
  process.exit(0);
}

const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));

function gitValue(command, fallback) {
  try {
    return execSync(command, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return fallback;
  }
}

const shortCommit = gitValue("git rev-parse --short HEAD", "dev");
const fullCommit = gitValue("git rev-parse HEAD", "dev");
const branch = gitValue("git branch --show-current", "main");

const output = `export const buildInfo = {
  version: ${JSON.stringify(packageJson.version)},
  shortCommit: ${JSON.stringify(shortCommit)},
  fullCommit: ${JSON.stringify(fullCommit)},
  branch: ${JSON.stringify(branch)}
} as const;\n`;

await mkdir(path.join(root, "src", "generated"), { recursive: true });
await writeFile(outputPath, output);
