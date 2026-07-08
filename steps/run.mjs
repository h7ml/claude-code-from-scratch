#!/usr/bin/env node
// Enter the code state at the end of chapter <N> and run it.
//   node steps/run.mjs 2                 # step 2 REPL (TypeScript)
//   node steps/run.mjs 2 -- "read foo"   # step 2 one-shot
//   node steps/run.mjs 2 --py            # step 2 in Python
// Reads ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL from the repo .env.

import { existsSync, readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const DIST = join(HERE, "dist");

const args = process.argv.slice(2);
const usePy = args.includes("--py");
const stepArg = args.find((a) => /^\d+$/.test(a));
const dashDash = args.indexOf("--");
const promptArgs = dashDash >= 0 ? args.slice(dashDash + 1) : [];
if (!stepArg) {
  console.error("Usage: node steps/run.mjs <stepNumber> [--py] [-- <prompt>]");
  process.exit(1);
}

// Generate the snapshots on first use so `run.mjs <N>` just works.
if (!existsSync(DIST)) {
  spawnSync("node", [join(HERE, "build.mjs")], { stdio: "inherit" });
}
const steps = existsSync(DIST) ? readdirSync(DIST).sort() : [];
const name = steps.find((s) => s.startsWith(String(stepArg).padStart(2, "0") + "-"));
if (!name) {
  console.error(`Step ${stepArg} not found. Run "npm run steps:build" first. Have: ${steps.join(", ")}`);
  process.exit(1);
}

// Load .env, but strip proxy vars — a local proxy breaks the API SDK here.
const env = { ...process.env };
delete env.http_proxy; delete env.https_proxy; delete env.all_proxy;
delete env.HTTP_PROXY; delete env.HTTPS_PROXY; delete env.ALL_PROXY;
const envFile = join(REPO, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2];
  }
}

if (usePy) {
  const entry = join(DIST, name, "py", "__main__.py");
  // Prefer the repo's venv (which has `anthropic`), else the system python.
  const venvPy = join(REPO, ".venv", "bin", "python");
  const py = existsSync(venvPy) ? venvPy : "python3";
  const r = spawnSync(py, [entry, ...promptArgs], { stdio: "inherit", env, cwd: REPO });
  process.exit(r.status ?? 0);
}

// TypeScript: compile the step's sources in place, then run cli.js.
const tsDir = join(DIST, name, "ts");
const tsc = join(REPO, "node_modules", ".bin", "tsc");
const build = spawnSync(
  tsc,
  ["--module", "nodenext", "--moduleResolution", "nodenext", "--target", "es2022",
   "--skipLibCheck", "--outDir", tsDir, join(tsDir, "cli.ts")],
  { stdio: "inherit", env, cwd: REPO }
);
if (build.status !== 0) process.exit(build.status ?? 1);
const r = spawnSync("node", [join(tsDir, "cli.js"), ...promptArgs], { stdio: "inherit", env, cwd: REPO });
process.exit(r.status ?? 0);
