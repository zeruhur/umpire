import { AdjudicationDraft, DiceResult, FactionAction, LeverageGrade } from "../types";

function clean(text: string): string {
  return text.replace(/^```[a-zA-Z]*\s*\n?/gm, "").replace(/\n?```\s*$/gm, "").trim();
}

export function maybeFence(text: string, wrap: boolean): string {
  const body = clean(text);
  return wrap ? `\`\`\`\n${body}\n\`\`\`` : body;
}

export function formatAction(action: FactionAction, wrap: boolean): string {
  const suffix = action.isNPA ? " (NPA)" : "";
  const privacy = action.isPrivate ? "\n[Private]" : "";
  return maybeFence([
    `@ ${action.factionName}${suffix}`,
    `  act: ${action.act}`,
    `  out: ${action.out}`,
    `  lev: ${action.lev}`,
  ].join("\n") + privacy, wrap);
}

export function formatLeverageGrade(grade: LeverageGrade): string {
  return `[Lev:${grade}]`;
}

export function formatDice(result: DiceResult): string {
  const notation = result.grade === "Strong" ? "2d6kh1" : "2d6kl1";
  const doubles = result.isDoubles ? "  DOUBLES" : "";
  return `d: ${notation} -> ${result.kept} [${result.die1},${result.die2}]${doubles}`;
}

export function formatAdjudication(draft: AdjudicationDraft): string {
  const lines = [`-> ${clean(draft.outcome)}`];
  for (const consequence of draft.consequences.map(clean).filter(Boolean)) {
    lines.push(`=> ${consequence}`);
  }
  return lines.join("\n");
}

export function formatForceOfNature(text: string): string {
  const lines = clean(text).split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return "";
  const [first, ...rest] = lines;
  const output = [`[FoN: ${first.replace(/^\[?FoN:?\s*/i, "").replace(/\]?$/, "")}]`];
  for (const line of rest) {
    output.push(line.startsWith("=>") ? line : `=> ${line}`);
  }
  return output.join("\n");
}
