# Running a phase as an agent team

Use this when a request is big enough to split across systems. The team: a **lead** (the main session), two **builders** and
**QA**. Agent definitions are in `.claude/agents/` (`builder-living`, `builder-environment`, `qa`).

## Roles

| Role | Owns (see `src/README.md`) | Job |
|---|---|---|
| Lead | Core, frame loop, menus, items, building, saving, physics, the skill | Plans the phase, writes one brief per builder, reviews and merges, runs QA last, ships and reports to the user |
| Builder: living world | Trees and plants, the player's body, the character, animals on land and in the sea | Builds its part of the phase in its own worktree and branch |
| Builder: environment | Island shape and ground truth, terrain, sky, sun, moon, shadows, time, water, weather, sound | Builds its part of the phase in its own worktree and branch |
| QA | Nothing; it only tests | Runs once **both** builders are done, on the merged result, and reports pass or fail with evidence |

## The brief (lead → builder)

Each brief states: the goal and the user's words; the reference-game qualities it must deliver; the files the builder owns and the
one-line hooks it may add elsewhere; the shared contracts it must keep; the performance budget; the screenshots and checks that
decide "done"; the branch name; and what to report. Builders follow this skill's thinking logic and standard.

## Rules for builders

- Work only in your worktree, on your branch (`team/<role>-<phase>`). Commit there; do not push, and do not merge.
- Change another owner's file only for a small hook, and list it in your report.
- **One headless browser at a time across the whole team:** wrap every browser run in the shared lock, at quality low or
  medium, and serve your worktree on your own port (living 8771, environment 8772, QA 8773):
  `flock /tmp/hale-moku-browser.lock node <script>` (a software browser uses 6–9 GB; two at once can exhaust memory).
- Headless game time barely moves; tick systems by hand to test behaviour (see `testing-and-shipping.md`).
- Report: what you built, how you checked it (with screenshot paths), what you could not check, what is still weak, every file
  you touched outside your own, and any new asset with its licence and credit line.

## Merging and QA

1. When both builders are done, the lead merges both branches into the working branch and resolves any conflict.
2. QA runs on the merged build: page errors in WebGPU and WebGL, the phase's checks, screenshots from player positions, the
   frame cost against the previous build, and old saves still loading.
3. If QA fails, the lead sends the failures back to the builder that owns them, then QA runs again.
4. When QA passes: README and credits, commit, push the working branch and `main`, and report to the user.

## When to run as one agent instead
Subagents start cold and re-read the project every time they start or resume, and two builders in parallel spend a usage limit
fast (on Hale Moku both stopped twice at the limit, mid-task, with nothing committed the first time). When the user's limit is
tight, run the phase in the main session: merge any builder branches yourself, then build and QA in one place. Either way, tell
builders to **commit after every working step**, so a stop loses nothing.
