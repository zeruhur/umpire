import { ActorRegistration } from "./types";
import { formatActorRegistration, maybeFence } from "./factionlog/formatter";

const privateBriefRe = /^\s*\*?\s*Private Brief\b.*$/i;
const labelRe = /^\s*(?:[-*]\s*)?\*\*([^:*]+):?\*\*:?|\s*(?:[-*]\s*)?([^:]+):/;

export function briefToFactionlog(text: string, wrap: boolean): string {
  const actors = parseBriefActors(text);
  if (!actors.length) return "";
  return maybeFence(actors.map((actor) => formatActorRegistration(actor, false)).join("\n"), wrap);
}

export function parseBriefActors(text: string): ActorRegistration[] {
  const lines = stripFences(text).split("\n");
  const starts = lines
    .map((line, index) => privateBriefRe.test(line) ? index : -1)
    .filter((index) => index >= 0);

  return starts
    .map((start, index) => parsePrivateBrief(lines.slice(start, starts[index + 1] ?? lines.length)))
    .filter((actor): actor is ActorRegistration => actor !== null);
}

function parsePrivateBrief(lines: string[]): ActorRegistration | null {
  const section = lines.join("\n");
  const rawName = valueAfterLabel(lines, "Faction Name") || headingName(lines[0]);
  if (!rawName) return null;

  const isNPA = /\b(?:NPA|Non-Player Actor)\b/i.test(`${lines[0]}\n${rawName}`);
  const name = rawName.replace(/\s*\((?:NPA|Non-Player Actor)\)\s*/ig, "").trim();
  const shortTerm = valueAfterLabel(lines, "Short-term");
  const longTerm = valueAfterLabel(lines, "Long-term");
  const objectiveLines = collectBetween(lines, "Objectives", "Position");
  const objectives = [
    shortTerm ? `Short-term: ${shortTerm}` : "",
    longTerm ? `Long-term: ${longTerm}` : "",
  ].filter(Boolean).join("; ") || objectiveLines.join("; ");
  const position = collectBetween(lines, "Position", "Special Abilities", true).join("; ") || valueAfterLabel(lines, "Position");
  const bonuses = parseBonuses(section);
  const behavior = valueAfterLabel(lines, "Behavior") || collectBetween(lines, "Behavior", "Special Abilities").join("; ");

  if (!name || !objectives || !position) return null;
  return {
    name,
    objectives,
    position,
    bonuses: bonuses || undefined,
    behavior: isNPA ? behavior || undefined : undefined,
    isNPA,
  };
}

function stripFences(text: string): string {
  return text.replace(/^```[a-zA-Z]*\s*\n?/gm, "").replace(/\n?```\s*$/gm, "").trim();
}

function headingName(line: string): string {
  const match = line.match(/Private Brief:\s*(.+?)\s+only/i);
  return clean(match?.[1] ?? "");
}

function valueAfterLabel(lines: string[], label: string): string {
  const index = lines.findIndex((line) => labelName(line).toLowerCase() === label.toLowerCase());
  if (index < 0) return "";
  const sameLine = clean(lines[index].replace(labelLineRe(label), ""));
  if (sameLine) return sameLine;
  for (const line of lines.slice(index + 1)) {
    if (!line.trim()) continue;
    if (labelName(line)) break;
    return clean(line);
  }
  return "";
}

function collectBetween(lines: string[], startLabel: string, endLabel: string, breakOnAnyLabel = false): string[] {
  const start = lines.findIndex((line) => labelName(line).toLowerCase() === startLabel.toLowerCase());
  if (start < 0) return [];
  const values: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const label = labelName(line);
    if (label && (label.toLowerCase() === endLabel.toLowerCase() || breakOnAnyLabel)) break;
    const value = clean(line);
    if (value && !/^\|?\s*-+\s*\|/.test(value) && !/^Name\s*\|\s*Uses/i.test(value)) values.push(value);
  }
  return values;
}

function parseBonuses(section: string): string {
  const bonuses: string[] = [];
  for (const line of section.split("\n")) {
    const cells = line.split("|").map((cell) => clean(cell)).filter(Boolean);
    if (cells.length < 2 || /^Name$/i.test(cells[0]) || /^-+$/.test(cells[0])) continue;
    const [name, rawUses] = cells;
    if (!name || !rawUses) continue;
    const uses = /^\d+$/.test(rawUses) ? `${rawUses}/${rawUses}` : rawUses;
    bonuses.push(`"${name}" ${uses}`);
  }
  return bonuses.join(", ");
}

function labelName(line: string): string {
  const match = line.match(labelRe);
  return clean(match?.[1] ?? match?.[2] ?? "");
}

function labelLineRe(label: string): RegExp {
  return new RegExp(`^\\s*(?:[-*]\\s*)?\\*\\*${escapeRegExp(label)}:?\\*\\*:?\\s*|^\\s*(?:[-*]\\s*)?${escapeRegExp(label)}:\\s*`, "i");
}

function clean(text: string): string {
  return text
    .replace(/^\s*[-*]\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
