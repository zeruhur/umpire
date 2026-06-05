import { App, TFile } from "obsidian";
import { NoteFrontMatter } from "./types";

export function getFrontMatter(app: App, file: TFile): NoteFrontMatter {
  return (app.metadataCache.getFileCache(file)?.frontmatter ?? {}) as NoteFrontMatter;
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}
