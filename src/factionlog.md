---
title: Factionlog
subtitle: A Standard Notation for Open Strategy Game Session Logging
author: Roberto Bisceglie
version: 0.2.0
license: CC BY-SA 4.0
lang: en
parent: Lonelog v1.4.0
---

## 1. Introduction

### 1.1 Why Factionlog?

The Referee's job doesn't end when the dice drop. Every adjudication needs to be recorded with enough structure to be traceable: what the faction argued, why their leverage was graded the way it was, what the dice produced, and what changed in the world as a result. The Report is the public face of this work. The session log is the working record behind it.

Free-form notes lose the mechanics. A raw dice log loses the leverage argument. A pure narrative loses the board state. Factionlog offers a different approach: a compact shorthand that captures the essential elements of OSG play (the three-part action argument, the leverage grade, the adjudication, and the consequences) in a format that is fast to write, easy to review, and legible to anyone who knows the system.

### 1.2 What Factionlog Does

For live tables, asynchronous campaigns, and archived records, this notation helps you:

- Record every faction's three-part action (act / out / lev) in a consistent structure
- Document the leverage grade and dice result for every adjudicated action
- Track faction positions, spendable bonuses, and board-state changes across turns
- Write Reports that are grounded in and traceable to the session log
- Share the complete game record with players who will understand the format at a glance

The notation is designed to be:

- **Compact**: the argument is structured, not verbose
- **Traceable**: every outcome points back to the leverage argument that produced it
- **Format-agnostic**: works in digital markdown or paper notebooks
- **Extensible**: optional layers for persistent tracking and solo play

### 1.3 How to Use This Notation

Five elements mirror the natural flow of OSG adjudication:

- `@` for each faction's submitted action (three-part argument)
- `d:` for the dice mechanic (2d6, keep-high or keep-low)
- `->` for the adjudicated outcome
- `=>` for the consequence on the board state
- The Report block for the public summary

That's the core. Everything else (faction tags, bonus tracking, location markers, clocks) is optional. Add it when the game's complexity requires it.

### 1.4 Quick Start: One Turn

```
@ Meranto
  act: Send the debt review notice to Caldrath's treasury
  out: Delay Caldrath's army movement for thirty days
  lev: We hold all loan documentation; emergency clause has precedent
[Lev:Strong]
d: 2d6 → 5,3  keep high → 5
-> Partial success — review opens, but scope is disputed
=> Caldrath treasury enters review; army movement delayed one turn

@ Caldrath
  act: Deploy advance units to Essaveth's northern pass
  out: Establish military presence before any treaty negotiation
  lev: Largest army on the peninsula; units are one day's march away
[Lev:Strong]
d: 2d6 → 6,2  keep high → 6
-> Success, and...
=> [Fac:Caldrath | pos:pass occupied]
=> Essaveth's border garrison stands down without resistance

 Meranto stalls Caldrath's army. Caldrath moves on Essaveth.
    The Conclave issues no statement. The pass is occupied. 
```

That is a full turn. Everything else in this document handles complexity when you need it.

### 1.5 Factionlog and Lonelog

Factionlog is a fork of Lonelog, a notation system for solo RPG session logging. Lonelog's core philosophy (separate mechanics from fiction, stay compact, scale from one-shots to campaigns) carries directly into OSG play. The tag system and formatting conventions are shared. The core symbols shift to reflect OSG's specific model: faction-scale play, simultaneous action submission, and the three-part argument that structures every action.

If you know Lonelog, you'll feel at home. If you don't, this document is fully standalone.

## 2. Digital vs. Analog Formats

### 2.1 Digital Format (Markdown)

In digital markdown files:

- Campaign metadata: YAML front matter, top of file
- Campaign title: Level 1 heading
- Sessions: Level 2 headings (`## Session 1`)
- Turns: `[Turn:N]` markers within sessions
- Core notation and tracking: inside code blocks
- Report text: regular prose between code blocks

> **Note:** Always wrap notation in code blocks when using digital markdown.
> This prevents conflicts with Markdown syntax and ensures symbols like `=>`
> render correctly.

### 2.2 Analog Format (Notebooks)

In paper notebooks:

- Write headers and metadata directly as shown
- Core notation works identically but without code fences
- Use the same symbols and structure
- Brackets and tags help scanning paper pages

### 2.3 Format Examples

**Digital:**

```markdown
## Session 1
Date: 2026-05-01 | Turns: 1–2
```

```
[Turn:1]

@ Meranto
  act: File debt review against Caldrath's treasury
  out: Delay army movement thirty days
  lev: Emergency clause, full documentation, precedent established
[Lev:Strong]
d: 2d6 → 6,2  keep high → 6
-> Success
=> [Fac:Caldrath | pos:army held at border | Clock:LiquidityReview 1/3]
```

**Analog:**

```
Turn 1

@ Meranto
  act: File debt review against Caldrath's treasury
  out: Delay army movement thirty days
  lev: Emergency clause, full documentation, precedent established
[Lev:Strong]
d: 2d6 → 6,2  keep high → 6
-> Success
=> [Fac:Caldrath | pos:army held | Clock:LiquidityReview 1/3]
```

Both formats use identical notation; only the wrapping differs.

## 3. Core Notation

This is the heart of the system. Five elements mirror the natural flow of OSG adjudication: the faction argues its action, the Referee grades leverage, dice decide, and the board changes.

### 3.1 Faction Actions (`@`)

The `@` symbol represents a faction submitting its turn action. Every action in OSG follows the same three-part structure:

```
@ FactionName
  act: What specifically are they doing?
  out: What result do they want?
  lev: Why is this action likely to produce that outcome?
```

The three sub-lines are not optional decoration. They are the argument the Referee adjudicates. `act` commits the faction to a specific course of conduct. `out` separates what they are doing from what they want: the Referee adjudicates the outcome, not just the action. `lev` is the case for why the plan should work, grounded in established fiction: resources, relationships, positioning, prior actions.

**Example: full argument:**

```
@ Meranto
  act: Send formal notice of debt review to Caldrath's treasury,
       citing the emergency clause in our lending agreements
  out: Delay Caldrath's army movement by forcing a liquidity
       assessment before any major campaign expenditure
  lev: Caldrath's military expansion was financed by Meranto loans.
       The emergency clause exists, has precedent, and their treasury
       minister knows invoking it freezes discretionary spending for
       thirty days. We hold documentation for every transaction.
```

**Example: compact (fast play):**

```
@ Meranto
  act: Invoke emergency debt clause against Caldrath
  out: Freeze army expenditure for one turn
  lev: Full documentation; clause has precedent
```

Both are valid. Use the level of detail the game requires.

#### 3.1.1 Spendable Bonuses in the Argument

If an action spends a named bonus asset, record the spend inside the leverage line using the `[Bon:]` tag:

```
@ Saivorn
  act: Rush naval assets to the Corenth harbour mouth
  out: Establish a naval blockade before Caldrath can resupply
  lev: Two deep-water ports give unmatched transit speed;
       [Bon:HarbourRights 1/2 → 0/2] — treaty access to
       Corenth's outer anchorage invoked
```

The bonus tag ticks down at the point of use, visible in the leverage argument where it matters for adjudication.

### 3.2 Leverage Grade (`[Lev:]`)

Before rolling, the Referee grades the acting faction's leverage as **Strong** or **Weak** relative to any opposition.

Record the grade on its own line between the argument and the roll:

```
[Lev:Strong]
[Lev:Weak]
```

**Strong** means the faction has enough established advantage (resources, relationships, positioning, prior actions) that success is more likely than not.

**Weak** means the attempt is plausible but without a strong basis for expecting success: thin resources, an entrenched opponent, no established presence in the relevant domain.

The Referee is not scoring a debate. Strong or Weak is a qualitative judgment following from the leverage argument and the established fiction.

### 3.3 The Dice Mechanic (`d:`)

OSG uses 2d6: **keep the high die** for Strong leverage, **keep the low die** for Weak leverage.

```
d: 2d6 → 5,3  keep high → 5   (Strong)
d: 2d6 → 5,3  keep low  → 3   (Weak)
```

**Result interpretation:**

| Kept die | Outcome                                                |
| :------- | :----------------------------------------------------- |
| 6        | Success; something especially good may also occur      |
| 4–5      | Desired outcome occurs                                 |
| 2–3      | Action proceeds, but outcome is worse than desired     |
| 1        | Worst outcome; something especially bad may also occur |

#### 3.3.1 Force of Nature (Doubles)

When both dice show the same number, the Referee may introduce a Force of Nature: a chaotic event outside any faction's control. Record it on its own line:

```
d: 2d6 → 3,3  DOUBLES
[FoN: harbour storm grounds all sea transit next turn]
=> All sea transit actions opposed next turn
=> Saivorn's naval advantage temporarily neutralized
```

The Force of Nature is a prompt, not a requirement. Use it only when it fits the fiction and creates genuine complications, at most once or twice per game.

### 3.4 Adjudication Result (`->`)

The `->` line declares the adjudicated outcome: what actually happened, following from the leverage grade and the dice.

```
-> Success
-> Partial success — review opens, but scope is disputed
-> Failure — Corenth does not respond
-> Success, and... Essaveth's garrison stands down unprompted
-> Failure, and... Caldrath learns of the attempt
```

The result should pass the RAT check: **Reasonable** (proportionate to the fiction), **Actionable** (leaves something for other factions to respond to), and **Traceable** (points to earlier events). If an outcome fails any of these, rewrite it before moving to consequences.

### 3.5 Consequences and Board State (`=>`)

The `=>` symbol records what changes in the world as a result of the adjudicated outcome: faction positions, contested zones, clock progress, and anything other factions must now contend with.

```
=> [Fac:Caldrath | pos:army held at border | Clock:LiquidityReview 1/3]
=> Caldrath's chancellor publicly accuses Meranto of bad faith
=> [Fac:Meranto | pos:diplomatically exposed in Corenth]
```

Chain multiple `=>` lines for cascading effects. Every outcome should leave at least one visible hook for another faction.

### 3.6 The Report Block

At the end of each turn, the Referee publishes a public Report. Record it in a delimited block immediately after the turn's adjudications:

```

 Meranto's debt clause stalls Caldrath's army at the border.
    Saivorn's diplomatic overture is rebuffed — and Caldrath now
    knows. Essaveth has gone quiet. The Conclave has summoned
    representatives from all factions to the temple complex.
    Next turn: the question is who arrives first. 
```

The `` delimiters separate the Report narrative from the notation log. The Report is public fiction; everything inside it is known to all factions. Private outcomes not in the Report are logged only in `=>` consequence lines inside the relevant faction's block.

## 4. Optional Layers

### 4.1 Persistent Elements

#### 4.1.1 Faction Tags (`[Fac:]`)

Track faction state across turns. Establish at `[T0]` and update as the board changes.

```
[Fac:Meranto | obj:control Corenth debt leverage
             | pos:agents everywhere, no map token
             | bon:"Emergency Recall" 1/1, "Debt Clause" 2/2]
```

Fields:

- `obj:` the faction's objectives (from the Brief; does not change)
- `pos:` the current position on the board (updates each turn)
- `bon:` spendable bonuses with remaining uses

Updating faction state: show only what changed:

```
[Fac:Caldrath | pos:army held at border]
[Fac:Caldrath | pos:pass occupied]
[Fac:Saivorn  | pos:diplomatically exposed]
```

#### 4.1.2 Spendable Bonuses (`[Bon:]`)

```
[Bon:"Debt Clause" 2/2]      — full, two uses remaining
[Bon:"Debt Clause" 1/2]      — one use spent
[Bon:"Debt Clause" 0/2]      — exhausted
```

A bonus should be contextually bounded: its narrative name indicates when it applies. A spent bonus cannot be recovered.

#### 4.1.3 NPA Tags (`[NPA:]`)

For Non-Player Actors controlled by the Referee, track objective, position, and behavior rule:

```
[NPA:Conclave | obj:Corenth remains neutral | pos:temple complex
             | behavior:mediates; escalates if temple threatened]
```

NPA actions use `@` notation identical to player faction actions. The Referee adjudicates them the same way.

#### 4.1.4 Locations (`[L:]`)

Mark significant locations and their current control state.

```
[L:Corenth       | contested | Conclave extraterritorial temple]
[L:Northern Pass | Caldrath-occupied]
[L:Harbour Mouth | Saivorn-patrolled]
```

#### 4.1.5 Objectives (`[Obj:]`)

Track each faction's objectives from the Brief. Mark them at game end for the debrief.

```
[Obj:Control Corenth debt leverage      | Open]
[Obj:Prevent Caldrath military presence | Open]
[Obj:Isolate Saivorn from Conclave      | Achieved T4]
[Obj:Preserve Meranto financial network | Failed]
```

#### 4.1.6 Events and Clocks (`[E:]`, `Clock:`)

```
[E:CaldhrathLiquidity | Clock: 1/3]   — Caldrath treasury under review
[E:ConclaveSummit     | Clock: 0/1]   — imminent
[E:EssavethResistance | Clock: 2/4]   — building
```

### 4.2 Turn Zero (`[T0]`)

Turn Zero is the pre-game clarification session. Log world assumptions, faction setups, and any rulings made before Turn 1 here.

```
[T0]
rule: Unopposed actions succeed; the Referee still determines
      how they land — every success reshapes the board
rule: Talking is free — negotiation between factions costs no
      turn; only what you actually do costs your action
rule: One action per faction per turn; two things in one
      action will be returned for revision
assumption: Caldrath's army is one day's march from Corenth
            at game start
assumption: Meranto has no physical presence on the map —
            leverage only, no tokens

[Fac:Meranto | obj:control Corenth debt leverage
             | pos:agents everywhere, no map token
             | bon:"Emergency Recall" 1/1, "Debt Clause" 2/2]
[NPA:Caldrath  | obj:military dominance of Corenth
               | pos:army at northern border
               | behavior:aggressive; moves on Corenth if unopposed by T3]
[NPA:Saivorn   | obj:secure port access to Corenth
               | pos:coast, two deep-water ports
               | behavior:opportunistic if Caldrath weakened]
[NPA:Essaveth  | obj:preserve pass autonomy
               | pos:northern passes, small garrison
               | behavior:defensive; seeks alliance if threatened]
[NPA:Conclave  | obj:Corenth remains neutral
               | pos:temple complex, extraterritorial
               | behavior:mediates; escalates if temple threatened]
```

### 4.3 Meta Notes

Step outside the fiction for rulings, design notes, and retrospective annotations.

```
(rule: NPA behavior tables rolled before each turn, results private
       until logged as @ actions)
(post: Turn 3 reconstructed from notes — dialogue is paraphrased)
(note: Caldrath player absent Turn 2; NPA holding action used)
```

## 5. Optional Structure

### 5.1 Game Header

```yaml
---
title: The Corentine Crisis
system: Open Strategy Game
hack: Factionlog
turns: 6
factions: Meranto, Caldrath, Saivorn, Essaveth, Conclave
date: 2026-05-01
---
```

### 5.2 Session Header

For multi-session games:

```
## Session 1
Date: 2026-05-01
Turns: 1–2
Recap: Turn Zero complete. Factions established.
       Caldrath is already moving.
```

### 5.3 Debrief

At game end, record each faction's self-assessment:

```
[Debrief]
Meranto:  Debt Clause delayed Caldrath two turns. Conclave
          alliance failed. Financial network intact.
          Obj:1 Achieved | Obj:2 Partial | Obj:3 Failed

[Obj:Control Corenth debt leverage      | Achieved]
[Obj:Prevent Caldrath military presence | Partial]
[Obj:Preserve Meranto financial network | Achieved]
```

## 6. Complete Turn Example

A full multi-faction turn from *The Corentine Crisis*, Turn 2.

```
[Turn:2]

@ Meranto
  act: Approach Essaveth privately — offer to underwrite their
       garrison costs in exchange for pass access rights
  out: Establish a quiet alliance before Caldrath occupies the pass
  lev: Essaveth is under military pressure and has no defensive pact.
       Meranto holds their small infrastructure debt. Immediate
       financial relief — something Caldrath cannot match.
       [Bon:"Debt Clause" 2/2 → 1/2]
[Lev:Strong]
d: 2d6 → 4,6  keep high → 6
-> Success, and... Essaveth accepts — and volunteers intelligence
   on Caldrath's supply line through the pass
=> [Fac:Essaveth | pos:quiet Meranto ally | Bon:IntelligenceFile 1/1]
=> [Fac:Meranto  | pos:pass access secured | bon:"Debt Clause" 1/2]
=> Essaveth's public posture remains neutral — alliance is secret

@ Caldrath
  act: Send an envoy to Essaveth demanding right of passage for
       the army, framed as a treaty obligation
  out: Secure legal cover for army movement through the pass
  lev: Largest army on the peninsula; Essaveth owes historical
       obligations from the old compact; the army is already visible
       at the border — implicit threat requires no elaboration
[Lev:Strong]
d: 2d6 → 2,5  keep high → 5
-> Partial success — Essaveth stalls, citing the need for
   Conclave ratification before any troop movement
=> [Fac:Caldrath | pos:army delayed at border | Clock:PassNegotiation 1/3]
=> Caldrath's envoy returns empty-handed — publicly noted

@ Conclave (NPA)
  act: Issue a formal invitation to all factions for a Corenth
       summit, citing the army movements as a threat to the
       neutral zone
  out: Establish itself as the legitimate mediating authority
       before any faction acts unilaterally in Corenth
  lev: Extraterritorial status; all factions have obligations
       under the old treaty; the neutral city gives the Conclave
       standing no other actor can claim
[Lev:Strong]
d: 2d6 → 3,5  keep high → 5
-> Success — all factions receive the invitation
=> [E:ConclaveSummit | Clock: 1/1] — summit is imminent, Turn 3
=> Every faction must now decide: attend, refuse, or act before it

 Caldrath's envoy returns from Essaveth without an answer.
    The Conclave has summoned all factions to Corenth.
    The summit will be held next turn. Essaveth has gone quiet.
    Meranto's agents were seen near the northern pass.
    The question now is who arrives in Corenth, and how. 
```

## 7. Solo Extension

When playing OSG solo (see Part IX of *Contested Ground* or the Solo OSG rules), the Referee role collapses into the player. Factionlog's core notation works unchanged; every Autonomous Actor's action is logged with `@` notation exactly like a player faction's. Two additions support solo-specific mechanics.

### 7.1 Oracle Queries (`?`)

Use the `?` symbol to record any query to a random table or oracle system used to generate an AA's action or resolve uncertainty:

```
? What does Caldrath attempt this turn?
- NPAAction d6 → 3: Military advance

@ Caldrath
  act: [generated from table result: advance on the pass]
  ...
```

The oracle query is logged so the reasoning behind a generated action is visible when reviewing the record later.

### 7.2 AA Action Tables (`tbl:`)

Inline table definitions make the log self-contained:

```
tbl: CaldhrathAction d6
  1 Hold position
  2 Apply diplomatic pressure
  3 Military advance
  4 Economic blockade
  5 Alliance approach
  6 Escalate — open aggression
tbl: CaldhrathAction d6 → 3
- Military advance
```

Define each AA's action table once at `[T0]` and reference it by name on subsequent turns.

### 7.3 Rival Tags (`[Rival:]`)

In solo play, use `[Rival:]` in place of `[NPA:]` to distinguish AA-driven factions from Referee-controlled NPAs in a hybrid game:

```
[Rival:Saivorn | obj:secure port access | pos:coast
              | behavior:opportunistic if Caldrath weakened]
```

## 8. Best Practices

**Do** write the full three-part argument before recording the leverage grade. The grade follows from the argument, not the other way around.

**Don't** record a leverage grade and then construct an argument to justify it. The argument is what gets adjudicated.

**Do** log NPA and AA actions with the same `@` structure as player faction actions, including the full argument.

**Don't** log faction actions as bare outcomes: `@ Caldrath moves army.` Without the argument, the log is not traceable.

**Do** let the `->` outcome be proportionate and leave a hook. Every result, success or failure, should give at least one other faction something to respond to.

**Don't** write outcomes that close the fiction: `-> Success. Caldrath is defeated.` OSG ends after a fixed number of turns, not when one faction is eliminated.

**Do** tick down `[Bon:]` tags at the moment of spend, inside the leverage argument where they appear.

**Don't** track bonuses separately from the argument. The spend is part of the case for why the action should succeed.

**Do** write the Report block in the voice of the public record: what all factions know. Keep private outcomes out of it.

**Don't** put private intelligence or secret alliance details in the Report block. Log them in `=>` consequence lines, not in the public summary.

## 9. Quick Reference

### Core Symbols

| Symbol | Meaning                                     | Example                         |
| :----- | :------------------------------------------ | :------------------------------ |
| `@`    | Faction action (three-part argument)        | `@ Meranto`                     |
| `d:`   | OSG dice roll (2d6 keep high/low)           | `d: 2d6 → 4,6  keep high → 6`  |
| `->`   | Adjudicated outcome                         | `-> Partial success`            |
| `=>`   | Board-state consequence                     | `=> [Fac:Caldrath \| pos:...]`  |
| `?`    | Oracle query *(solo extension)*             | `? What does Saivorn attempt?`  |

### Action Argument

```
@ FactionName
  act: What specifically are they doing?
  out: What result do they want?
  lev: Why is this likely to produce that outcome?
[Lev:Strong] or [Lev:Weak]
d: 2d6 → H,L  keep high/low → result
-> outcome
=> consequence
```

### Dice Results

| Kept die | Outcome                                               |
| :------- | :---------------------------------------------------- |
| 6        | Success, and... (something especially good may occur) |
| 4–5      | Desired outcome occurs                                |
| 2–3      | Outcome worse than desired                            |
| 1        | Failure, and... (something especially bad may occur)  |
| Doubles  | Potential Force of Nature                             |

### Tags

| Tag                      | Purpose                | Example                                |
| :----------------------- | :--------------------- | :------------------------------------- |
| `[Fac:Name \| ...]`      | Faction state          | `[Fac:Meranto \| pos:...]`             |
| `[NPA:Name \| ...]`      | NPA state              | `[NPA:Conclave \| behavior:...]`       |
| `[Rival:Name \| ...]`    | AA state *(solo)*      | `[Rival:Caldrath \| behavior:...]`     |
| `[Lev:Strong/Weak]`      | Leverage grade         | `[Lev:Strong]`                         |
| `[Bon:Name N/max]`       | Spendable bonus        | `[Bon:"Debt Clause" 1/2]`              |
| `[Obj:... \| state]`     | Faction objective      | `[Obj:Isolate Saivorn \| Achieved T4]` |
| `[L:Name \| ...]`        | Location state         | `[L:Corenth \| contested]`             |
| `[E:Name \| Clock: X/Y]` | Event / clock          | `[E:ConclaveSummit \| Clock: 1/1]`     |
| `[Turn:N]`               | Turn marker            | `[Turn:3]`                             |
| `[T0]`                   | Turn Zero block        | `[T0]`                                 |
| `[Debrief]`              | End-of-game assessment | `[Debrief]`                            |

## 10. FAQ

**Q: Does every submitted action need to be logged in full?**
A: Yes, always, but compact form is fine for fast play. `act/out/lev` can each be a single line. What matters is that all three are present. The leverage line is what gets graded; without it, the adjudication has no record.

**Q: How do I log an Unopposed action?**
A: Write the `@` block and the `=>` consequence normally; omit the `[Lev:]` grade and `d:` roll. Mark the outcome as Unopposed if clarity requires it:

```
@ Meranto
  act: Establish a courier network across the eastern provinces
  out: Ensure private message delivery regardless of road conditions
  lev: Existing agent network; no competing faction present
-> Unopposed — network established
=> [Fac:Meranto | pos:eastern courier network active]
```

**Q: How do I handle a faction that drops out mid-game?**
A: Convert them to an NPA. Add a `behavior:` field to their tag and note the transition:

```
[NPA:Essaveth | pos:occupied | behavior:passive; holds position
             | note: player absent from T4, NPA from T4]
```

**Q: Can I use Factionlog for a game I'm running as Referee, not playing in?**
A: Yes. That is the primary use case. All `@` blocks log submitted actions as the Referee received them. The Referee's own reasoning is recorded in the `[Lev:]` grade and `->` outcome lines.

**Q: Does Factionlog work with any OSG scenario?**
A: Yes. The notation is system-agnostic within the OSG framework: it assumes the three-part action structure, the 2d6 keep-high/low mechanic, and the turn/report cycle. Scenario-specific mechanics (spendable bonuses, NPAs, maps) are all optional layers.

**Q: How does Factionlog relate to Lonelog add-ons?**
A: Factionlog is a fork, not an add-on. It replaces the solo character-action model entirely. Lonelog add-ons (Combat, Dungeon Crawling, Resource Tracking) are not designed for faction-scale play and are not compatible with Factionlog without adaptation.

## Credits & License

© 2026 Roberto Bisceglie

Factionlog is forked from Lonelog v1.4.0 by Roberto Bisceglie. It shares Lonelog's core philosophy, tag system, and structural conventions, adapted for Open Strategy Game play.

The Open Strategy Game format was defined by Chris McDowall, originating in the Matrix Game tradition established by Chris Engle and Tom Mouat. This document draws on the practice and analysis of Chris McDowall and Sam Doebler.

Version History:

- v 0.2.0  Reframed as Referee session log; solo extension moved to §7
- v 0.1.0  Initial draft

This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License. Session logs and play records created using this notation are your own work and are not subject to this license.
