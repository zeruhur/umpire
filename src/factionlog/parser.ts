import { AdjudicationDraft, BoardState, BonusSpend, DiceResult, FactionAction, LeverageGrade } from "../types";

const actionHeaderRe = /^\s*(?:@|►)\s*(.+?)\s*$/;
const stopRe = /^\s*(?:@|►|\[Turn:|\[T0\]|#{1,6}\s+Turn|\s*---\s*$)/i;

export function stripFrontMatter(text: string): string {
  return text.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}

function stripFences(text: string): string {
  return text.replace(/^```[a-zA-Z]*\s*\n?/gm, "").replace(/\n?```\s*$/gm, "").trim();
}

function cleanFieldMarker(line: string): { key: "act" | "out" | "lev"; value: string } | null {
  const match = line.match(/^\s*(act|out|lev)\s*:?\s+(.+)$/i);
  if (!match) return null;
  return { key: match[1].toLowerCase() as "act" | "out" | "lev", value: match[2].trim() };
}

export function parseActionBlock(text: string): FactionAction | null {
  const lines = stripFences(text).split("\n");
  const headerIndex = lines.findIndex((line) => actionHeaderRe.test(line));
  if (headerIndex < 0) return null;

  const header = lines[headerIndex].match(actionHeaderRe);
  const rawName = header?.[1]?.trim() ?? "";
  if (!rawName) return null;

  const fields: Record<"act" | "out" | "lev", string[]> = { act: [], out: [], lev: [] };
  let current: "act" | "out" | "lev" | null = null;

  for (const line of lines.slice(headerIndex + 1)) {
    if (stopRe.test(line) && !cleanFieldMarker(line)) break;
    if (/^\s*(?:\[Lev:|LevStrong|LevWeak|d:|d\s|->|=>|\[FoN:)/i.test(line)) break;

    const marker = cleanFieldMarker(line);
    if (marker) {
      current = marker.key;
      fields[current].push(marker.value);
    } else if (current && line.trim()) {
      fields[current].push(line.trim());
    }
  }

  const act = fields.act.join(" ").trim();
  const out = fields.out.join(" ").trim();
  const lev = fields.lev.join(" ").trim();
  if (!act || !out || !lev) return null;

  const isNPA = /\(NPA\)$/i.test(rawName) || /^\[?\s*(?:NPA|Rival)\s*[: ]/i.test(rawName);
  const factionName = rawName
    .replace(/\s*\(NPA\)$/i, "")
    .replace(/^\[?\s*(?:NPA|Rival)\s*[: ]\s*/i, "")
    .replace(/\]?$/, "")
    .trim();

  return {
    factionName,
    act,
    out,
    lev,
    bonSpent: parseBonusSpends(lev),
    isNPA,
    isPrivate: /\[Private\]/i.test(text),
  };
}

function parseBonusSpends(text: string): BonusSpend[] | undefined {
  const spends = Array.from(text.matchAll(/\[Bon:"?([^"\]|]+)"?\s+(\d+\/\d+)\s*(?:->|→)\s*(\d+\/\d+)\]/g)).map((match) => ({
    name: match[1].trim(),
    before: match[2],
    after: match[3],
  }));
  return spends.length ? spends : undefined;
}

export function parseLeverageGrade(text: string): LeverageGrade | null {
  if (/\[Lev:Strong\]|\bLevStrong\b/i.test(text)) return "Strong";
  if (/\[Lev:Weak\]|\bLevWeak\b/i.test(text)) return "Weak";
  return null;
}

export function parseDiceResult(text: string): DiceResult | null {
  const explicitGrade = parseLeverageGrade(text);
  const canonical = text.match(/d:?\s*2d6(kh1|kl1)\s*(?:->|→)\s*(\d)\s*\[\s*(\d)\s*,\s*(\d)\s*\]/i);
  if (canonical) {
    const notationGrade: LeverageGrade = canonical[1].toLowerCase() === "kh1" ? "Strong" : "Weak";
    const die1 = Number(canonical[3]);
    const die2 = Number(canonical[4]);
    return {
      die1,
      die2,
      kept: Number(canonical[2]),
      grade: explicitGrade ?? notationGrade,
      isDoubles: die1 === die2 || /\bDOUBLES\b/i.test(text),
    };
  }

  const dice = text.match(/d:?\s*2d6\s*(?:->|→)?\s*(\d)\s*,\s*(\d).*?keep\s+(high|low)\s*(?:->|→)?\s*(\d)/i);
  if (!dice) return null;
  const die1 = Number(dice[1]);
  const die2 = Number(dice[2]);
  return {
    die1,
    die2,
    kept: Number(dice[4]),
    grade: explicitGrade ?? (dice[3].toLowerCase() === "high" ? "Strong" : "Weak"),
    isDoubles: die1 === die2 || /\bDOUBLES\b/i.test(text),
  };
}

export function parseBoardState(noteBody: string, depthLines: number): BoardState {
  const lines = stripFrontMatter(noteBody).split("\n").slice(-depthLines);
  const state: BoardState = {
    lastTurnId: "",
    factionTags: new Map(),
    npaTags: new Map(),
    rivalTags: new Map(),
    locationTags: new Map(),
    eventClocks: new Map(),
    objectives: new Map(),
    recentBeats: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const turn = trimmed.match(/^(?:\[Turn:([^\]]+)\]|\[T0\]|#{1,6}\s+(Turn\s*\d+))/i);
    if (turn) state.lastTurnId = turn[0];

    collectTag(trimmed, "Fac", state.factionTags);
    collectTag(trimmed, "NPA", state.npaTags);
    collectTag(trimmed, "Rival", state.rivalTags);
    collectTag(trimmed, "L", state.locationTags);
    collectTag(trimmed, "E", state.eventClocks);
    collectTag(trimmed, "Obj", state.objectives);

    if (/Clock:/i.test(trimmed)) state.eventClocks.set(clockKey(trimmed), trimmed);
    if (/^(?:@|►|d:|d\s|->|=>|\[FoN:)/.test(trimmed)) state.recentBeats.push(trimmed);
  }

  state.recentBeats = state.recentBeats.slice(-20);
  return state;
}

function collectTag(line: string, tag: string, target: Map<string, string>): void {
  const re = new RegExp(`\\[${tag}:([^|\\]]+)(?:\\|[^\\]]*)?\\]`, "gi");
  for (const match of line.matchAll(re)) {
    target.set(match[1].trim(), line);
  }
}

function clockKey(line: string): string {
  const event = line.match(/\[E:([^|\]]+)/i);
  const clock = line.match(/Clock:\s*([^|\]]+)/i);
  return (event?.[1] ?? clock?.[1] ?? line).trim();
}

export function serializeBoardState(state: BoardState): string {
  const sections: string[] = [];
  if (state.lastTurnId) sections.push(`Last recorded turn: ${state.lastTurnId}`);
  pushMap(sections, "Faction positions", state.factionTags);
  pushMap(sections, "NPA positions", state.npaTags);
  pushMap(sections, "Rival positions", state.rivalTags);
  pushMap(sections, "Location state", state.locationTags);
  pushMap(sections, "Events and clocks", state.eventClocks);
  pushMap(sections, "Objectives", state.objectives);
  if (state.recentBeats.length) sections.push(`Recent beats:\n${state.recentBeats.join("\n")}`);
  return sections.join("\n\n");
}

function pushMap(sections: string[], label: string, map: Map<string, string>): void {
  const values = Array.from(map.values());
  if (values.length) sections.push(`${label}:\n${values.join("\n")}`);
}

export function parseAdjudicationDraft(text: string): AdjudicationDraft {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const outcome = (lines.find((line) => line.startsWith("->")) ?? lines[0] ?? "").replace(/^->\s*/, "");
  const consequences: string[] = [];
  for (const line of lines) {
    if (line.startsWith("=>")) {
      consequences.push(line.replace(/^=>\s*/, ""));
    } else if (consequences.length > 0 && !line.startsWith("->")) {
      consequences[consequences.length - 1] += " " + line;
    }
  }
  return { outcome, consequences: consequences.length ? consequences : [""] };
}

export function findActionBlockAt(text: string, offset: number): string | null {
  const before = text.slice(0, offset).split("\n");
  let startLine = -1;
  for (let i = before.length - 1; i >= 0; i -= 1) {
    if (actionHeaderRe.test(before[i])) {
      startLine = i;
      break;
    }
  }
  if (startLine < 0) return null;

  const allLines = text.split("\n");
  let endLine = allLines.length;
  for (let i = startLine + 1; i < allLines.length; i += 1) {
    if (stopRe.test(allLines[i]) && actionHeaderRe.test(allLines[i])) {
      endLine = i;
      break;
    }
  }
  return allLines.slice(startLine, endLine).join("\n");
}
