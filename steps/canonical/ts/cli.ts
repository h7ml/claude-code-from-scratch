import * as readline from "readline";
import { pathToFileURL } from "url";
import { Agent } from "./agent.js";

// A tiny REPL: read a line, hand it to the agent, repeat. One-shot mode runs a
// single prompt from argv and exits (handy for scripts and testing). Exported as
// runCli(argv) so it can be driven in-process without spawning a shell.
export async function runCli(argv: string[] = process.argv.slice(2)): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY (and optionally ANTHROPIC_BASE_URL) first.");
    process.exit(1);
  }

  const agent = new Agent();
  const oneShot = argv.join(" ").trim();
  if (oneShot) {
    await agent.chat(oneShot);
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("mini-claude — type a message, or 'exit' to quit.\n");
  await new Promise<void>((resolve) => {
    const ask = () => {
      rl.question("you: ", async (line) => {
        const input = line.trim();
        if (input === "exit" || input === "quit") { rl.close(); resolve(); return; }
        if (input) await agent.chat(input);
        ask();
      });
    };
    ask();
  });
}

// Run only when executed directly (not when imported for tests/demos).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) runCli();
