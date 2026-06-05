import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as esbuild from "esbuild";

const outputDir = path.join(tmpdir(), "umpire-smoke-tests");
const outputFile = path.join(outputDir, "smoke-tests.mjs");

await mkdir(outputDir, { recursive: true });
await esbuild.build({
  entryPoints: ["tests/smoke-tests.ts"],
  outfile: outputFile,
  bundle: true,
  platform: "node",
  format: "esm",
  logLevel: "silent",
});

await import(pathToFileURL(outputFile).href);
