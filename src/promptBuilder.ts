import { DiceResult, FactionAction, LeverageGrade, NoteFrontMatter } from "./types";

export function buildSystemPrompt(frontMatter: NoteFrontMatter): string {
  if (frontMatter.system_prompt_override?.trim()) return frontMatter.system_prompt_override.trim();
  return [
    "You are Umpire, a Referee assistant for Open Strategy Game sessions.",
    "You are not a game master and not a narrator. The Referee keeps final authority.",
    "Do not invent lore, factions, locations, resources, or facts absent from the provided note metadata, board state, and action text.",
    "Apply OSG principles: one action per faction, Strong or Weak leverage, 2d6 kept die, the RAT checklist, and no action without friction.",
    "RAT means Reasonable, Actionable, Traceable.",
    "Use concise, concrete language grounded in established board state.",
    "Return only the requested content. Do not explain your process.",
  ].join("\n");
}

export function buildContext(frontMatter: NoteFrontMatter, boardState: string): string {
  return [
    `Title: ${frontMatter.title ?? "Untitled"}`,
    `System: ${frontMatter.system ?? "Open Strategy Game"}`,
    `Current turn: ${frontMatter.current_turn ?? "unknown"}`,
    `Factions: ${(frontMatter.factions ?? []).join(", ") || "unspecified"}`,
    `NPAs: ${(frontMatter.npas ?? []).join(", ") || "none specified"}`,
    `Language: ${frontMatter.language ?? "en"}`,
    "",
    "Board state:",
    boardState || "No board state extracted.",
  ].join("\n");
}

export function leveragePrompt(context: string, action: FactionAction): string {
  return [
    context,
    "",
    "Recommend whether this action has Strong or Weak leverage. Give exactly one first line: Strong or Weak. Then give two short reasons.",
    formatActionForPrompt(action),
  ].join("\n");
}

export function adjudicationPrompt(context: string, action: FactionAction, grade: LeverageGrade, dice: DiceResult): string {
  return [
    context,
    "",
    "Draft a Factionlog adjudication for the action below.",
    "Output exactly one outcome line beginning with -> and one or more consequence lines beginning with =>.",
    "Do not include dice, leverage grade, report prose, or explanation.",
    `Leverage: ${grade}`,
    `Dice kept result: ${dice.kept} from ${dice.die1},${dice.die2} — ${diceLabel(dice.kept)}`,
    "Dice interpretation: 6 = critical success (desired outcome occurs; something especially good also occurs), 4-5 = success (desired outcome occurs), 2-3 = partial success (action proceeds but outcome is worse than desired), 1 = failure (action proceeds but something especially bad occurs).",
    formatActionForPrompt(action),
  ].join("\n");
}

function diceLabel(kept: number): string {
  if (kept === 6) return "Critical Success";
  if (kept >= 4) return "Success";
  if (kept >= 2) return "Partial Success";
  return "Failure";
}

export function forceOfNaturePrompt(context: string, dice: DiceResult): string {
  return [
    context,
    "",
    `Doubles were rolled: ${dice.die1},${dice.die2}.`,
    "Draft one optional Force of Nature that is traceable to existing board state and creates table-wide complications.",
    "Return one short first line for [FoN:] and optional consequence lines. Do not invent unrelated lore.",
  ].join("\n");
}

export function reportPrompt(context: string, turnBlock: string): string {
  return [
    context,
    "",
    "Draft the public Report for this turn in brief, factual, third-person news-roundup prose.",
    "Exclude adjudication reasoning. Do not reveal private outcomes except as small traceable crumbs.",
    "Return only report prose, not code fences.",
    "",
    "Current turn block:",
    turnBlock,
  ].join("\n");
}

export function briefPrompt(pitch: string): string {
  const premise = pitch.trim()
    ? `Use this pitch as the campaign seed: ${pitch.trim()}`
    : "The pitch is blank. Propose a random but plausible genre, subject, crisis, and cast suitable for Open Strategy Game play.";
  return [
    "Generate a complete Open Strategy Game campaign brief.",
    premise,
    "",
    "Design constraints:",
    "- Use 5 to 8 differentiated player Actors.",
    "- Include 0 to 2 optional Non-Player Actors only if they create useful referee pressure.",
    "- Every Actor needs asymmetric objectives, a concrete starting position, and at least one hook involving another Actor.",
    "- Use concise, playable material. Avoid lore dumps.",
    "- Keep the game credible: objectives should create tension without requiring one fixed plot.",
    "- Include Special Abilities as spendable bonuses when useful. Uses must be written as a number or as current/max, such as 1 or 2/2.",
    "- Mark Non-Player Actors clearly with (NPA) in the private brief heading and faction name.",
    "",
    "Return only the brief in exactly this Markdown structure:",
    "",
    "**Brief Template**",
    "",
    "*General Brief: distributed to all players*",
    "",
    "**The Problem:** one sentence",
    "**The World:** broad strokes, shared context",
    "**The Actors:** one public sentence per faction",
    "**Structure:** Each Actor submits one Action per turn in the format Action / Outcome / Leverage. The game ends after X turns. Objectives are self-assessed at game end.",
    "**Expectations:** The goal of the game is to achieve your objectives. The point of the game is to create a credible narrative.",
    "",
    "---",
    "*Private Brief: this Actor only*",
    "",
    "**Faction Name:**",
    "**Objectives:**",
    "",
    "- Short-term:",
    "- Long-term:",
    "",
    "**Position:**",
    "-",
    "-",
    "-",
    "",
    "**Special Abilities** *(if using bonuses)*:",
    "",
    "| Name | Uses | Description |",
    "| ---- | ---- | ----------- |",
    "|      |      |             |",
    "",
    "Repeat the Private Brief section once for each Actor and NPA.",
  ].join("\n");
}

function formatActionForPrompt(action: FactionAction): string {
  return [
    `@ ${action.factionName}${action.isNPA ? " (NPA)" : ""}`,
    `act: ${action.act}`,
    `out: ${action.out}`,
    `lev: ${action.lev}`,
    action.isPrivate ? "private: true" : "private: false",
  ].join("\n");
}
