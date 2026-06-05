# Umpire Obsidian Plugin Specification

Version: 0.1.0 MVP

Umpire is an Obsidian plugin for Referees running Open Strategy Game sessions. It helps record private faction actions, grade leverage, roll the OSG dice mechanic, draft adjudications, draft Force of Nature prompts, and assemble a public turn Report. The Referee remains the final authority: AI output is always reviewed before insertion.

This specification is authoritative for the MVP implementation. It reconciles the plugin behavior with the local references in `src/factionlog.md`, `src/osg_handbook.md`, and `src/contested_ground.md`.

## Canonical Notation

All generated output must use Factionlog notation:

```text
@ FactionName
  act: What the faction does
  out: What result it wants
  lev: Why the action should work
[Lev:Strong]
d: 2d6kh1 -> 6 [6,2]
-> Adjudicated outcome
=> Consequence or board-state update
```

The plugin must emit only canonical Factionlog. The parser should accept canonical notation and tolerate the older draft dialect where unambiguous:

- Action headers: canonical `@ FactionName`; compatibility `► FactionName`.
- Field labels: canonical `act:`, `out:`, `lev:`; compatibility `act`, `out`, `lev` followed by text.
- Leverage grade: canonical `[Lev:Strong]` or `[Lev:Weak]`; compatibility `LevStrong` and `LevWeak`.
- Dice: canonical `d: 2d6kh1 -> 5 [5,3]` for Strong and `d: 2d6kl1 -> 3 [5,3]` for Weak. Compatibility: older `d: 2d6 -> 5,3  keep high -> 5` and `d 2d6 5,3 keep high 5`.
- Results: `->`.
- Consequences: `=>`.
- Board state tags: bracketed tags such as `[Fac:]`, `[NPA:]`, `[Rival:]`, `[L:]`, `[E:]`, `[Obj:]`, `[FoN:]`, and `Clock:`.

Use ASCII arrows (`->`) in plugin output for Markdown and editor compatibility. The Factionlog reference examples sometimes use `→`; parsers must accept either `->` or `→`.

## MVP Scope

The MVP includes:

- Standard Obsidian plugin scaffold.
- Settings tab with provider and insertion settings.
- Gemini generation via raw `fetch`.
- Non-Gemini providers present as unsupported stubs.
- Front matter as the only scenario/session configuration source.
- Factionlog parser and canonical formatter.
- Prompt builder grounded in OSG and board state.
- Commands:
  - Submit Action.
  - Grade Action.
  - Roll Dice.
  - Draft Adjudication.
  - Draft Force of Nature.
  - Draft Turn Report.
- Review modals for all generated or user-entered content before insertion.

Post-MVP:

- OpenAI, Anthropic, Ollama implementations.
- Source upload/list/delete flows.
- Source management UI.
- Debrief generation.
- NPA generation.
- Automated test harness beyond TypeScript build.
- Advanced command polish and richer parsing recovery.

## Repository Layout

The MVP source layout is:

- `manifest.json`: Obsidian plugin manifest. `id` must remain stable once installed in a vault.
- `package.json`: build and development scripts.
- `esbuild.config.mjs`: bundles `src/main.ts` to `main.js`.
- `main.js`: generated Obsidian plugin bundle.
- `src/main.ts`: plugin command registration and command orchestration.
- `src/types.ts`: shared settings, front matter, action, dice, board-state, and generation types.
- `src/settings.ts`: Obsidian settings tab and default settings.
- `src/frontmatter.ts`: typed accessors for Obsidian front matter.
- `src/editor.ts`: active editor helpers and insertion helpers.
- `src/factionlog/parser.ts`: Factionlog compatibility parser and board-state scanner.
- `src/factionlog/formatter.ts`: canonical Factionlog formatter.
- `src/promptBuilder.ts`: system prompt, context serialization, and task prompts.
- `src/modals.ts`: review and input modals.
- `src/providers/base.ts`: provider interface.
- `src/providers/gemini.ts`: Gemini REST provider.
- `src/providers/index.ts`: provider factory and unsupported-provider stubs.
- `src/factionlog.md`, `src/osg_handbook.md`, `src/contested_ground.md`: local reference documents used to reconcile this spec.

The plugin should not require runtime files outside the generated `main.js`, `manifest.json`, and Obsidian's saved plugin data. Reference markdown files are development inputs, not files that commands read at runtime.

## Runtime Boundaries

Umpire is a local Obsidian plugin. It reads the active note content and note front matter through Obsidian APIs, calls the configured provider only when an AI command is explicitly invoked, and inserts text only after a modal confirmation.

The MVP has no background synchronization, no remote storage, no source upload flow, and no automatic note mutation. The Gemini API key is stored in Obsidian plugin data via `loadData`/`saveData`.

Commands registered with `editorCallback` are available only from Markdown editor contexts. If a command is ever changed to run outside `editorCallback`, it must call `getActiveMarkdownContext` or equivalent and show `Umpire: open a Markdown note first.` when no Markdown note is active.

## Build And Packaging

The supported build command is:

```text
npm run build
```

The build must:

- Run TypeScript with strict checking and no emit.
- Bundle `src/main.ts` into `main.js`.
- Treat Obsidian and Node built-ins as external.
- Keep the output compatible with Obsidian desktop.

For manual installation in a vault, copy or symlink `manifest.json` and `main.js` into:

```text
<vault>/.obsidian/plugins/umpire/
```

During development, `npm run dev` may watch and rebuild `main.js`, but this is not part of MVP acceptance.

## Front Matter Schema

All per-note configuration lives in YAML front matter:

```yaml
---
title: The Corentine Crisis
system: Open Strategy Game
factions:
  - Meranto
  - Caldrath
npas:
  - Conclave
turn_count: 6
turns_per_session: 2
current_turn: 2
current_session: 1
board_context: Optional manually curated board state summary
provider: gemini
model: gemini-2.5-flash
temperature: 0.7
system_prompt_override: Optional replacement system prompt
language: en
sources: []
---
```

`provider`, `model`, and `temperature` override plugin settings for that note. `board_context` overrides parsed board-state context when present. `sources` is reserved for post-MVP provider source management.

## Shared Types

```ts
type ProviderID = "gemini" | "openai" | "anthropic" | "ollama";
type LeverageGrade = "Strong" | "Weak";

interface FactionAction {
  factionName: string;
  act: string;
  out: string;
  lev: string;
  bonSpent?: BonusSpend[];
  isNPA: boolean;
  isPrivate?: boolean;
}

interface DiceResult {
  die1: number;
  die2: number;
  kept: number;
  grade: LeverageGrade;
  isDoubles: boolean;
}
```

External formatting for grades is always `[Lev:Strong]` or `[Lev:Weak]`.

## Settings

Plugin settings:

- `activeProvider`: default `gemini`.
- `providers.gemini.apiKey`: empty by default.
- `providers.gemini.defaultModel`: default `gemini-2.5-flash`.
- `providers.openai`, `providers.anthropic`, `providers.ollama`: stored for post-MVP, unavailable for generation.
- `insertionMode`: `cursor` or `end-of-note`, default `cursor`.
- `wrapInCodeBlocks`: default `true`.
- `contextDepthLines`: default `160`.
- `defaultTemperature`: default `0.7`.
- `showTokenCount`: default `false`.

Settings persistence:

- Defaults are supplied from `DEFAULT_SETTINGS`.
- On load, saved data is shallow-merged over defaults.
- Provider settings are merged so adding future provider keys does not discard existing saved Gemini settings.
- Empty Gemini model input resets to `gemini-2.5-flash`.
- `contextDepthLines` must be clamped to at least 20 lines when edited through settings.

## Provider Request Flow

1. Resolve active Markdown editor and note.
2. Read note front matter.
3. Resolve provider from note front matter, falling back to plugin settings.
4. Resolve model and temperature.
5. Parse board state from note body unless `board_context` is set.
6. Build a system prompt and task-specific user message.
7. Validate provider settings.
8. Call `provider.generate`.
9. Open a review modal.
10. Insert only accepted or edited text.

Resolution rules:

- Note `provider` overrides `activeProvider`.
- Note `model` overrides the selected provider default model.
- Note `temperature` overrides `defaultTemperature`.
- `system_prompt_override`, when non-empty, replaces the built-in system prompt entirely.
- `board_context`, when non-empty, replaces parsed board-state context entirely.
- `language` is passed through to the context. It does not translate existing note text.

Gemini MVP endpoint:

```text
POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
```

The request uses `systemInstruction`, one user `contents` message, and `generationConfig.temperature` plus `generationConfig.maxOutputTokens`. No SDK is used.

Provider interface:

```ts
interface AIProvider {
  readonly id: string;
  readonly name: string;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  validate(): Promise<boolean>;
}
```

`GenerationResponse.text` is required. Token counts are optional because providers expose usage metadata differently. If `showTokenCount` is true, the plugin should show best-effort input/output token counts after a successful generation.

Required notices:

- No Markdown editor: `Umpire: open a Markdown note first.`
- Missing Gemini API key: `Umpire: add a Gemini API key in settings.`
- Unsupported provider: `Umpire: only Gemini generation is available in the MVP.`
- No parseable action: `Umpire: select or place the cursor in a parseable Factionlog action.`
- Missing leverage grade: `Umpire: add or select a leverage grade before rolling.`
- Missing dice result: `Umpire: roll dice before drafting adjudication.`
- No doubles for Force of Nature: `Umpire: select a dice result with doubles first.`
- Provider failure: `Umpire: generation failed. Check settings and network access.`

Provider failures should log the underlying error to the developer console and show only the user-facing notice above.

## Parser Requirements

`parseActionBlock(text)` returns a `FactionAction` from one selected block. It accepts multi-line `act:`, `out:`, and `lev:` fields until the next known marker. It strips code fences.

`findActionAtCursorOrSelection(editor)` should first parse the selected text. If there is no selection, it scans around the cursor for the nearest action block beginning with `@` or `►` and ending before the next action block, Report separator, or turn marker.

`parseDiceResult(text)` accepts canonical `2d6kh1`/`2d6kl1` notation and infers Strong/Weak from the keep operator when no explicit `[Lev:]` marker is present. It should continue accepting the older `keep high`/`keep low` text form as compatibility input only.

`parseBoardState(note, depthLines)` scans the last `depthLines` body lines after front matter. It extracts the last occurrence of:

- `[Fac:Name | ...]`
- `[NPA:Name | ...]`
- `[Rival:Name | ...]`
- `[L:Name | ...]`
- `[E:Name | ...]`
- any line containing `Clock:`
- `[Obj:Name | ...]`
- recent action, dice, result, consequence, Force of Nature, and Report beats.

Last mention wins for state tags. Keep the last 20 recent beats.

## Formatter Requirements

The formatter emits canonical Factionlog only:

- `@ FactionName`
- indented `act:`, `out:`, `lev:`
- `[Lev:Strong]` or `[Lev:Weak]`
- `d: 2d6kh1 -> K [X,Y]` for Strong or `d: 2d6kl1 -> K [X,Y]` for Weak.
- optional `[FoN: text]`
- `-> text`
- one or more `=> text`

If `wrapInCodeBlocks` is true, inserted notation blocks are wrapped in triple backticks.

Formatting normalization:

- Formatter inputs may contain code fences; formatter output must not nest fences.
- Action blocks may include `[Private]` on its own line after `lev:` when the action is marked private.
- NPA actions are emitted as `@ Name (NPA)`.
- Dice notation follows standard roll-and-keep notation: `2d6` means roll two six-sided dice; `kh1` keeps the highest one; `kl1` keeps the lowest one. See https://en.wikipedia.org/wiki/Dice_notation.
- Dice doubles are emitted with a trailing `DOUBLES` marker on the `d:` line.
- `formatForceOfNature` emits the first accepted line as `[FoN: text]`; subsequent accepted lines become `=> text` unless already prefixed with `=>`.
- Empty Force of Nature review text inserts nothing.

## Insertion Contract

All insertion helpers trim the inserted content, add one leading newline and one trailing newline, and then insert according to `insertionMode`.

`cursor` mode replaces the current selection. If there is no selection, it inserts at the cursor.

`end-of-note` mode inserts after the last editor line.

Commands should insert generated material near the selected/current block when `cursor` mode is used. The plugin does not currently move the cursor automatically to the parsed block before insertion; the Referee is expected to place the cursor where the accepted text should go.

The following outputs respect `wrapInCodeBlocks`:

- Submit Action.

The following outputs are line fragments or prose and are not code-fenced by the formatter:

- Grade Action.
- Roll Dice.
- Draft Adjudication.
- Draft Force of Nature.
- Draft Turn Report.

If future commands insert complete notation blocks, they should honor `wrapInCodeBlocks`.

## Commands

Every command that uses AI must route the model response through a review modal. The command may pre-parse or normalize the draft before opening the modal, but the accepted text is always the modal's current value, not the raw provider response.

### Submit Action

Opens an action submission modal. Required fields: faction, action, desired outcome, leverage. Optional fields: NPA, private. On submit, inserts a canonical `@` action block. No AI call.

Modal behavior:

- The Insert button is the only submit path.
- If any required field is blank, clicking Insert does nothing and the modal remains open.
- The NPA toggle appends the canonical `(NPA)` suffix through the formatter.
- The Private toggle appends `[Private]` through the formatter.

### Grade Action

Requires a parseable selected/current action. Calls Gemini for a short leverage recommendation. The AI may recommend `Strong` or `Weak` and provide reasoning, but the modal requires Referee confirmation. Insertion is only `[Lev:Strong]` or `[Lev:Weak]`.

Recommendation parsing:

- If the first non-empty provider text begins with `Weak`, the initial modal selection is `Weak`.
- Otherwise, the initial modal selection is `Strong`.
- The reasoning text is displayed for review but is never inserted.

### Roll Dice

Requires a parseable leverage grade in selection/current block. Rolls `2d6` locally. Strong emits and resolves `2d6kh1`; Weak emits and resolves `2d6kl1`. Inserts a canonical `d:` line. If doubles occur, include no Force of Nature automatically; the separate command drafts it.

Dice are generated locally with `Math.random`. No provider call is made, and no LLM may roll, choose, alter, or reroll dice. The kept die must match the parsed grade even if the selected action's leverage reasoning suggests a different grade.

### Draft Adjudication

Requires parseable action, leverage grade, and dice result. Calls Gemini to draft an outcome line and one or more consequence lines. Review modal fields: outcome text and consequences text. Inserts canonical `->` and `=>` lines.

Draft parsing:

- The first provider line beginning with `->` is used as the initial outcome.
- If no `->` line is found, the first non-empty provider line is used as the initial outcome.
- Provider lines beginning with `=>` become initial consequences.
- If no consequence is found, the consequences field starts with one empty line.
- On insert, blank consequence lines are discarded.

### Draft Force of Nature

Requires a dice result with doubles in the selected/current block. Calls Gemini for one traceable, table-wide complication. Review modal allows accept, edit, or dismiss. Inserts `[FoN: ...]` plus any accepted `=>` lines.

Force of Nature is optional. Dismissing the modal must make no edit. Accepting an empty or whitespace-only value must make no edit.

### Draft Turn Report

Collects only the current turn block, from the nearest `[Turn:N]` or `##/### Turn` marker through the next turn marker or end of note. Calls Gemini to draft brief public report prose that excludes private outcomes and avoids adjudication reasoning. Review modal inserts edited prose after the turn block.

Current-turn extraction:

- The cursor position determines the current turn.
- A turn starts at `[Turn:...]` or any Markdown heading whose text begins with `Turn`.
- If no previous turn marker exists, the turn block starts at the beginning of the note body.
- The turn block ends before the next turn marker or at end of note.
- The MVP passes only the extracted block to the report task prompt, but the broader board-state context may still summarize previous note state.

Report privacy:

- Lines marked `[Private]` must not be directly revealed.
- Private outcomes may influence public prose only as small traceable crumbs when the visible note context supports them.
- Reports must not include dice mechanics, leverage grades, action reasoning, hidden faction intent, or prompt/debug text.
- Reports should be public-facing prose, not Factionlog notation.

## Modal Contracts

Review modals must support accept/edit/dismiss for generated text:

- Dismiss closes the modal and makes no edit.
- Insert/accept submits the current field values.
- Text areas must be large enough for short adjudications and reports without horizontal scrolling in normal desktop Obsidian windows.
- Modal labels should describe the Referee decision being made, not provider internals.

The MVP modal set is:

- `ActionSubmissionModal`: structured action entry.
- `LeverageConfirmModal`: provider recommendation plus Referee grade selection.
- `AdjudicationReviewModal`: separate outcome and consequence fields.
- `ReviewTextModal`: generic generated-text review for Force of Nature and Report.

## Prompt Rules

System prompt:

- Umpire is a Referee assistant, not a game master.
- Do not invent lore, factions, locations, or facts absent from front matter, sources, action text, or board state.
- Apply OSG principles: one action, Strong/Weak leverage, 2d6 kept die, RAT, no action without friction.
- Reports are brief, factual, third-person news-roundup prose.
- Output only the requested material, no Markdown explanations unless requested by the task.

Task prompts must include note metadata, factions, NPAs, current turn, board state, selected action, leverage grade, and dice result where relevant.

Prompt context serialization:

- Title defaults to `Untitled`.
- System defaults to `Open Strategy Game`.
- Current turn defaults to `unknown`.
- Factions default to `unspecified`.
- NPAs default to `none specified`.
- Language defaults to `en`.
- Empty parsed board state is serialized as `No board state extracted.`

Task output constraints:

- Leverage prompt: first line must be exactly `Strong` or `Weak`, followed by short reasons.
- Adjudication prompt: exactly one `->` outcome line and one or more `=>` consequence lines.
- Force of Nature prompt: one short first line suitable for `[FoN:]`, followed by optional consequence lines.
- Report prompt: prose only, no code fences.

The plugin should be robust when the provider violates these constraints, but recovery should be conservative. It is acceptable to prefill a modal imperfectly as long as the Referee can edit before insertion.

## Source And Reference Policy

The MVP does not upload, index, list, delete, or retrieve external sources. The `sources` front matter field is reserved for a later provider source-management feature and must not affect current generation behavior.

Local reference files in `src/` inform this specification, but command prompts do not read those files at runtime. Any OSG or Factionlog guidance needed by the provider must be present in `buildSystemPrompt`, task prompts, front matter, selected action text, or parsed board state.

Future source management must preserve the MVP safety model:

- The Referee explicitly chooses sources.
- Provider-specific source IDs remain visible in front matter or settings.
- Missing sources produce a clear notice instead of silent prompt degradation.
- Public reports still obey privacy rules even when source material contains private adjudications.

## Security And Privacy

The plugin sends note-derived content to the configured provider only after an AI command is invoked. The request may include:

- Note metadata from front matter.
- Parsed board-state summary.
- Selected/current action block.
- Current turn block for Report generation.
- Dice result and leverage grade where relevant.

The plugin must not send the entire vault, unrelated notes, settings data for unsupported providers, or the Gemini API key inside prompt text.

API keys are stored in Obsidian plugin data. The settings UI should not print keys to generated text, notices, console logs, or prompt context.

The MVP does not implement encryption, keychain integration, request redaction, or local-only model isolation. Those are post-MVP security enhancements.

## Implementation Status

Current MVP implementation status:

- Implemented: Obsidian scaffold, settings tab, Gemini provider, unsupported provider stubs, front matter reads, parser, formatter, prompt builder, command registration, review modals, local dice rolling, and TypeScript/esbuild build.
- Partially implemented: no-active-Markdown notice helper exists, but current commands use `editorCallback`; commands are effectively editor-only through Obsidian rather than manually checking active context.
- Not implemented: OpenAI/Anthropic/Ollama generation, provider source management, automated parser tests, debrief generation, NPA generation, advanced parsing diagnostics.

Known MVP follow-ups:

- Add focused parser/formatter unit tests outside Obsidian.
- Add manual QA notes or screenshots for light/dark modal usability.
- Decide whether Grade, Dice, Adjudication, and Force of Nature insertions should optionally wrap in code fences when inserted outside an existing fenced block.
- Consider detecting when the cursor is outside the parsed action block and warning before inserting line fragments.
- Normalize legacy Unicode examples in documentation once the reference files are encoding-clean.

## Acceptance Tests

Static:

- `npm install`.
- `npm run build`.
- TypeScript strict compile passes.

Parser/formatter:

- Canonical `@` action block parses.
- Old `►` action block parses.
- `act/out/lev` without colons parses when unambiguous.
- Canonical `d: 2d6kh1 -> K [X,Y]` and `d: 2d6kl1 -> K [X,Y]` parse.
- Legacy `d: 2d6 -> X,Y  keep high|low -> K` parses.
- Board state extracts `[Fac:]`, `[NPA:]`, `[Rival:]`, `[L:]`, `[E:]`, `Clock:`, `[Obj:]`.
- Formatter emits no `►`, `LevStrong`, `LevWeak`, old `keep high|low` dice lines, or uncolonized field labels.

Command scenarios:

- No active Markdown note shows the required notice.
- Missing Gemini key shows the required notice.
- Submit Action inserts a canonical `@` block.
- Grade Action requires a parseable action.
- Roll Dice requires a leverage grade, rolls locally without an AI/provider call, and inserts `2d6kh1` for Strong or `2d6kl1` for Weak.
- Adjudication requires grade and dice.
- Report generation scans only the current turn block.

Manual Obsidian checks:

- Plugin loads.
- Settings persist.
- Gemini generation works.
- Review modals are usable in light and dark themes.
- Insertions occur at cursor or note end according to settings.
