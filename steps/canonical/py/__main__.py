import os
import sys

from agent import Agent


# A tiny REPL: read a line, hand it to the agent, repeat. One-shot mode runs a
# single prompt from argv and exits (handy for scripts and testing). Takes argv
# so it can be driven in-process without spawning a shell.
def main(argv=None) -> None:
    if argv is None:
        argv = sys.argv[1:]
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Set ANTHROPIC_API_KEY (and optionally ANTHROPIC_BASE_URL) first.", file=sys.stderr)
        sys.exit(1)

    agent = Agent()
    one_shot = " ".join(argv).strip()
    if one_shot:
        agent.chat(one_shot)
        return

    print("mini-claude — type a message, or 'exit' to quit.\n")
    while True:
        try:
            line = input("you: ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break
        if line in ("exit", "quit"):
            break
        if line:
            agent.chat(line)


if __name__ == "__main__":
    main()
