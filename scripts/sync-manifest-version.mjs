import { readFile, writeFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const manifest = JSON.parse(await readFile("manifest.json", "utf8"));

manifest.version = packageJson.version;

await writeFile("manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
