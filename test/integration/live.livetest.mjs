// LIVE tests: drive the real CLI against the REAL model API (both backends),
// reading keys from .env. Real models are non-deterministic, so these assert
// robust behavioral invariants (a token is echoed; a file's content is reported
// after a real tool call) rather than exact text. Each test SKIPS cleanly when
// that backend's key isn't in .env, and RUNS when it is — so the same suite is
// safe in CI (no keys → all skip) and meaningful locally (keys → real coverage).
//
// Run just these with keys present:  node --test test/integration/live.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { runReplInteractive, liveKeyAvailable } from "./harness.mjs";

// A capable model per backend (behavioral prompts need real tool-use ability).
const MODEL = { anthropic: "claude-sonnet-4-5-20250929", openai: "gpt-4o" };

for (const backend of ["anthropic", "openai"]) {
  const skip = liveKeyAvailable(backend) ? false : `no ${backend} key in .env (live test skipped)`;

  test(`[live:${backend}] basic prompt reaches the real model`, { skip }, async () => {
    const { stdout } = await runReplInteractive({
      backend, live: true, model: MODEL[backend],
      steps: [{ send: "Reply with exactly the token LIVEPROBE7 and nothing else." }, { wait: /LIVEPROBE7|error/i }],
      timeoutMs: 60000,
    });
    assert.match(stdout, /LIVEPROBE7/, "the real model should echo the requested token");
  });

  test(`[live:${backend}] real tool use: reads a file and reports its content`, { skip }, async () => {
    const { stdout } = await runReplInteractive({
      backend, live: true, model: MODEL[backend], gitInit: true, // sandbox README.md = "hi\n"
      steps: [
        { send: "Read the file README.md in the current directory and tell me the single word it contains." },
        { wait: /\bhi\b|error/i },
      ],
      timeoutMs: 60000,
    });
    assert.match(stdout, /\bhi\b/, "the model should call read_file and report the file's content");
  });
}
