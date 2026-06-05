import assert from "node:assert/strict";
import { briefToFactionlog, parseBriefActors } from "../src/brief";
import { formatAction, formatActorRegistration, formatAdjudication, formatDice, formatForceOfNature, formatLeverageGrade } from "../src/factionlog/formatter";
import { findActionBlockAt, parseActionBlock, parseBoardState, parseDiceResult, parseLeverageGrade, serializeBoardState } from "../src/factionlog/parser";
import { adjudicationPrompt, briefPrompt, buildContext, buildSystemPrompt, forceOfNaturePrompt, leveragePrompt, reportPrompt } from "../src/promptBuilder";

const actionText = [
  "@ Meranto",
  "  act: Send the debt review notice to Caldrath's treasury",
  "  out: Delay Caldrath's army movement for thirty days",
  "  lev: We hold all loan documentation; emergency clause has precedent",
].join("\n");

const parsed = parseActionBlock(actionText);
assert.deepEqual(parsed, {
  factionName: "Meranto",
  act: "Send the debt review notice to Caldrath's treasury",
  out: "Delay Caldrath's army movement for thirty days",
  lev: "We hold all loan documentation; emergency clause has precedent",
  bonSpent: undefined,
  isNPA: false,
  isPrivate: false,
});

assert.equal(formatAction(parsed, false), actionText);
assert.equal(formatActorRegistration({
  name: "Meranto",
  objectives: "control Corenth debt leverage",
  position: "agents everywhere, no map token",
  bonuses: "\"Emergency Recall\" 1/1, \"Debt Clause\" 2/2",
  isNPA: false,
}, false), "[Fac:Meranto | obj:control Corenth debt leverage | pos:agents everywhere, no map token | bon:\"Emergency Recall\" 1/1, \"Debt Clause\" 2/2]");
assert.equal(formatActorRegistration({
  name: "Conclave",
  objectives: "Corenth remains neutral",
  position: "temple complex",
  behavior: "mediates; escalates if temple threatened",
  isNPA: true,
}, false), "[NPA:Conclave | obj:Corenth remains neutral | pos:temple complex | behavior:mediates; escalates if temple threatened]");
assert.equal(formatLeverageGrade("Strong"), "[Lev:Strong]");
assert.equal(parseLeverageGrade("[Lev:Weak]"), "Weak");

const strongDice = "d: 2d6kh1 -> 6 [6,2]";
assert.deepEqual(parseDiceResult(`[Lev:Strong]\n${strongDice}`), {
  die1: 6,
  die2: 2,
  kept: 6,
  grade: "Strong",
  isDoubles: false,
});
assert.equal(formatDice({ die1: 5, die2: 5, kept: 5, grade: "Weak", isDoubles: true }), "d: 2d6kl1 -> 5 [5,5]  DOUBLES");

assert.equal(formatAdjudication({
  outcome: "Partial success; review opens, but scope is disputed",
  consequences: ["Caldrath treasury enters review", ""],
}), "-> Partial success; review opens, but scope is disputed\n=> Caldrath treasury enters review");

assert.equal(formatForceOfNature("Storm shutters the pass\n[Fac:Caldrath | pos:delayed]"), "[FoN: Storm shutters the pass]\n=> [Fac:Caldrath | pos:delayed]");

const turnNote = [
  "---",
  "title: Contested Ground",
  "---",
  "[Turn:2]",
  actionText,
  "[Lev:Strong]",
  strongDice,
  "-> Success",
  "=> [Fac:Caldrath | pos:pass occupied]",
  "=> [L:Essaveth Pass | status:occupied]",
  "=> [E:Border Crisis | Clock:2/6]",
].join("\n");

const foundBlock = findActionBlockAt(turnNote, turnNote.indexOf("lev:") + 4);
assert.equal(foundBlock?.includes("@ Meranto"), true);
assert.equal(foundBlock?.includes("d: 2d6kh1"), true);

const boardState = parseBoardState(turnNote, 80);
const serialized = serializeBoardState(boardState);
assert.equal(boardState.lastTurnId, "[Turn:2]");
assert.equal(serialized.includes("Faction positions:"), true);
assert.equal(serialized.includes("[Fac:Caldrath | pos:pass occupied]"), true);
assert.equal(serialized.includes("Events and clocks:"), true);

const context = buildContext({
  title: "Contested Ground",
  system: "Open Strategy Game",
  current_turn: "2",
  factions: ["Meranto", "Caldrath"],
  npas: ["The Conclave"],
  language: "en",
}, serialized);

assert.equal(buildSystemPrompt({}).includes("RAT means Reasonable, Actionable, Traceable."), true);
assert.equal(leveragePrompt(context, parsed).includes("Give exactly one first line: Strong or Weak."), true);
assert.equal(adjudicationPrompt(context, parsed, "Strong", { die1: 6, die2: 2, kept: 6, grade: "Strong", isDoubles: false }).includes("Output exactly one outcome line"), true);
assert.equal(forceOfNaturePrompt(context, { die1: 4, die2: 4, kept: 4, grade: "Strong", isDoubles: true }).includes("Doubles were rolled: 4,4."), true);
assert.equal(reportPrompt(context, turnNote).includes("Current turn block:"), true);
assert.equal(briefPrompt("").includes("The pitch is blank."), true);
assert.equal(briefPrompt("Cold war between city-states").includes("Cold war between city-states"), true);

const generatedBrief = [
  "*General Brief: distributed to all players*",
  "",
  "**The Problem:** The harbor succession is contested.",
  "**The World:** A chain of city-states depends on one treaty port.",
  "**The Actors:** Meranto controls credit. Conclave mediates.",
  "",
  "---",
  "*Private Brief: this Actor only*",
  "",
  "**Faction Name:** Meranto",
  "**Objectives:**",
  "- Short-term: Freeze Caldrath's campaign funding",
  "- Long-term: Control Corenth debt leverage",
  "",
  "**Position:**",
  "- Agents everywhere",
  "- No map token",
  "",
  "**Special Abilities** *(if using bonuses)*:",
  "",
  "| Name | Uses | Description |",
  "| ---- | ---- | ----------- |",
  "| Debt Clause | 2 | Invoke emergency review clauses |",
  "",
  "---",
  "*Private Brief: Conclave (NPA) only*",
  "",
  "**Faction Name:** Conclave (NPA)",
  "**Objectives:**",
  "- Short-term: Keep temple access neutral",
  "- Long-term: Preserve ratification authority",
  "",
  "**Position:**",
  "- Temple complex",
  "- Legal archives",
  "**Behavior:** Mediates; escalates if temple threatened",
].join("\n");

const briefActors = parseBriefActors(generatedBrief);
assert.equal(briefActors.length, 2);
assert.equal(briefActors[0].name, "Meranto");
assert.equal(briefActors[0].bonuses, "\"Debt Clause\" 2/2");
assert.equal(briefActors[1].isNPA, true);
assert.equal(briefActors[1].behavior, "Mediates; escalates if temple threatened");
assert.equal(briefToFactionlog(generatedBrief, false), [
  "[Fac:Meranto | obj:Short-term: Freeze Caldrath's campaign funding; Long-term: Control Corenth debt leverage | pos:Agents everywhere; No map token | bon:\"Debt Clause\" 2/2]",
  "[NPA:Conclave | obj:Short-term: Keep temple access neutral; Long-term: Preserve ratification authority | pos:Temple complex; Legal archives | behavior:Mediates; escalates if temple threatened]",
].join("\n"));

console.log("Smoke tests passed.");
