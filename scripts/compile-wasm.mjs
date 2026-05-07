import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import wabtFactory from "wabt";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "src", "wasm", "granular_kernel.wat");
const outputDir = path.join(root, "public", "wasm");
const outputPath = path.join(outputDir, "granular_kernel.wasm");

const wat = await readFile(sourcePath, "utf8");
const wabt = await wabtFactory();
const parsed = wabt.parseWat(sourcePath, wat);
const { buffer } = parsed.toBinary({ log: false, write_debug_names: true });

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, Buffer.from(buffer));
