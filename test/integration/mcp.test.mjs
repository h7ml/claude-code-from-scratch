// MCP integration: a project .claude/settings.json declares a real external MCP
// server (spawned as a stdio subprocess by the CLI's McpManager); the model calls
// its prefixed tool (mcp__demo__add) and the result flows back through the chat
// loop. Exercises real MCP discovery + JSON-RPC routing end-to-end, both backends.
// Node CLI. (Reuses the tutorial's demo MCP server, which offers an `add` tool.)
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runReplInteractive, countCategory } from "./harness.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..", "..");
const MCP_SERVER = join(REPO, "steps", "mcp-demo-server.mjs");
const settings = JSON.stringify({ mcpServers: { demo: { command: "node", args: [MCP_SERVER] } } });

for (const backend of ["openai", "anthropic"]) {
  test(`[${backend}] MCP: external server tool is discovered and called`, async () => {
    // Interactive: MCP server spawn makes the turn slow enough to hit the
    // bulk-stdin readline race, so wait for the final marker, then exit.
    const { stdout, code, servedLog } = await runReplInteractive({
      backend, gitInit: true,
      sandboxFiles: { ".claude/settings.json": settings },
      steps: [{ send: "use the demo add tool to add 17 and 25" }, { wait: /MCP_DONE|Denied|error/i }],
      script: {
        main: [
          { tool_calls: [{ name: "mcp__demo__add", arguments: { a: 17, b: 25 } }] },
          { content: "MCP_DONE the sum is 42" },
        ],
      },
      timeoutMs: 25000,
    });
    assert.equal(code, 0, `exit (stdout: ${stdout})`);
    assert.match(stdout, /42/, "the MCP server's result (42) must flow back into the transcript");
    assert.match(stdout, /MCP_DONE/, "the round must reach the final turn after the MCP tool");
    assert.equal(countCategory(servedLog, "main"), 2);
  });
}
