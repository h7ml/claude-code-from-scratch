# Runnable steps

Each chapter of the tutorial has a **runnable code state**. Enter the code as it
stands at the end of chapter *N* and run it against a real model:

```bash
npm install                      # once, at the repo root
cp .env.example .env             # then put your key in .env (see below)

node steps/run.mjs 1             # chapter 1 REPL (TypeScript)
node steps/run.mjs 2 -- "create hello.txt with the text hi"   # one-shot
node steps/run.mjs 3 --py        # chapter 3, Python version
```

`.env` needs an Anthropic key (a relay works too):

```
ANTHROPIC_API_KEY=sk-...
ANTHROPIC_BASE_URL=https://api.anthropic.com   # or your relay
```

The three pilot steps:

| Step | Chapter | The agent can now… |
|------|---------|--------------------|
| 1 | Agent loop | talk to the model in a loop and call one tool (`read_file`) |
| 2 | Tools | read, write, edit, list, grep, and run shell commands |
| 3 | System prompt | behave like a coding agent (identity, rules, environment) |

## How it works — one source, generated snapshots

There is **one** source of truth in `steps/canonical/` (`ts/` and `py/`). A small
generator (`build.mjs`) slices it into self-contained, runnable snapshots under
`steps/dist/<step>/` — so the per-chapter code can never drift from the real
code, because it *is* the real code.

`run.mjs` builds the snapshots on first use, so you never call `build.mjs`
directly unless you want to inspect the output.

The canonical files carry step markers in comments:

```ts
//#step >=2          // keep the block below from step 2 onward
...
//#step <=2          // an "elif": used instead when building step 1 or 2
...
//#endstep
```

Python uses the same markers with a `#` leader (`#step >=2` … `#endstep`).
Lines outside any marker appear in every step. Consecutive `#step` lines before
an `#endstep` act as if/elif — the first branch whose condition matches the
target step wins.

## Adding or changing a step

1. Edit the canonical files under `steps/canonical/{ts,py}` (keep the two
   languages mirrored).
2. Register any new file and the step it first appears in, in `build.mjs`
   (`FILES`), and add the step to `STEPS`.
3. `node steps/run.mjs <N>` to regenerate and run.
