# Umpire

Umpire is an Obsidian plugin for referees running Open Strategy Game sessions. It records faction actions in Factionlog notation, grades leverage, rolls the OSG dice mechanic, drafts adjudications, drafts Forces of Nature, and assembles public turn reports.

The MVP keeps the referee in control: generated text is always shown in a review modal before it is inserted.

## MVP Status

Supported now:

- Factionlog action submission.
- Gemini-backed leverage grading.
- Strong/Weak OSG dice rolls.
- Gemini-backed adjudication drafts.
- Gemini-backed Force of Nature drafts for doubles.
- Gemini-backed public turn report drafts.
- Front matter based scenario/session context.

Post-MVP:

- OpenAI, Anthropic, and Ollama providers.
- Source management UI.
- Debrief generation.
- NPA generation.
- Broader automated tests.

## Build

Install dependencies:

```bash
npm install
```

Run the smoke tests:

```bash
npm test
```

Build the plugin:

```bash
npm run build
```

The build produces `main.js` from the TypeScript source.

## Manual Installation

Build the plugin, then copy these files into your vault:

```text
<vault>/.obsidian/plugins/umpire/
  manifest.json
  main.js
```

Restart Obsidian or reload plugins, then enable `Umpire` in Community plugins.

## BRAT Installation

Use BRAT for beta installation from this repository:

1. Install the Obsidian plugin `BRAT` from Community plugins.
2. Enable `BRAT`.
3. Open the command palette and run `BRAT: Add a beta plugin for testing`.
4. Enter this repository URL:

```text
https://github.com/zeruhur/umpire
```

5. When BRAT finishes installing, enable `Umpire` in Community plugins.

BRAT expects the repository to provide built plugin files, so `manifest.json` and `main.js` must be present in the repository or release being installed.

## Settings

Open `Settings -> Community plugins -> Umpire`.

Required for AI commands:

- Set `Active provider` to `Gemini`.
- Add a Gemini API key.
- Keep or change the Gemini model. The default is `gemini-2.5-flash`.

Useful defaults:

- `Insertion mode`: insert at cursor or append to end of note.
- `Wrap notation in code blocks`: wraps submitted action blocks in Markdown fences.
- `Context depth lines`: how much recent note history is scanned for board state.
- `Default temperature`: generation temperature for AI commands.

## Note Front Matter

Umpire reads scenario context from the active note front matter.

```yaml
---
title: Contested Ground
system: Open Strategy Game
current_turn: 2
factions:
  - Meranto
  - Caldrath
npas:
  - The Conclave
language: en
provider: gemini
model: gemini-2.5-flash
temperature: 0.7
---
```

Optional:

```yaml
board_context: |
  [Fac:Caldrath | pos:pass occupied]
  [E:Border Crisis | Clock:2/6]
system_prompt_override: |
  You are Umpire...
```

If `board_context` is absent, Umpire scans recent note lines for Factionlog board-state tags.

## Commands

Use Obsidian's command palette from a Markdown note:

- `Umpire: Submit Action`
- `Umpire: Register Actor`
- `Umpire: Generate Brief`
- `Umpire: Brief To Log`
- `Umpire: Grade Action`
- `Umpire: Roll Dice`
- `Umpire: Draft Adjudication`
- `Umpire: Draft Force of Nature`
- `Umpire: Draft Turn Report`

For action-level commands, place the cursor inside a parseable Factionlog action block or select the block.

`Generate Brief` asks for an optional campaign pitch, then opens a review modal before inserting the generated brief. Leave the pitch blank to have the model propose a plausible genre and subject.

`Brief To Log` parses selected brief text, or the whole active note if nothing is selected, and inserts `[Fac:...]` / `[NPA:...]` board-state tags from the private brief sections.

## Factionlog Example

```text
@ Meranto
  act: Send the debt review notice to Caldrath's treasury
  out: Delay Caldrath's army movement for thirty days
  lev: We hold all loan documentation; emergency clause has precedent
[Lev:Strong]
d: 2d6kh1 -> 6 [6,2]
-> Partial success; review opens, but scope is disputed
=> [Fac:Caldrath | pos:army delayed]
=> [E:Border Crisis | Clock:2/6]
```

Canonical output uses ASCII arrows (`->` and `=>`) for editor compatibility.
