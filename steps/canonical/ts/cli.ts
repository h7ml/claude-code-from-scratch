import * as readline from "readline";
import { Agent } from "./agent.js";

// A tiny REPL: read a line, hand it to the agent, repeat. One-shot mode runs a
// single prompt from argv and exits (handy for scripts and testing).
async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Set ANTHROPIC_API_KEY (and optionally ANTHROPIC_BASE_URL) first.");
    process.exit(1);
  }

  const agent = new Agent();
  const oneShot = process.argv.slice(2).join(" ").trim();
  if (oneShot) {
    await agent.chat(oneShot);
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("mini-claude — type a message, or 'exit' to quit.\n");
  const ask = () => {
    rl.question("you: ", async (line) => {
      const input = line.trim();
      if (input === "exit" || input === "quit") { rl.close(); return; }
      if (input) await agent.chat(input);
      ask();
    });
  };
  ask();
}

main();
