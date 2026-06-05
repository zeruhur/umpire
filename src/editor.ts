import { Editor, MarkdownView, Notice, TFile, WorkspaceLeaf } from "obsidian";
import { InsertionMode } from "./types";

export interface ActiveMarkdownContext {
  view: MarkdownView;
  editor: Editor;
  file: TFile;
}

export function getActiveMarkdownContext(leaf: WorkspaceLeaf | null): ActiveMarkdownContext | null {
  const view = leaf?.view;
  if (!(view instanceof MarkdownView) || !view.file) {
    new Notice("Umpire: open a Markdown note first.");
    return null;
  }
  return { view, editor: view.editor, file: view.file };
}

export function insertText(editor: Editor, text: string, mode: InsertionMode): void {
  const insertion = `\n${text.trim()}\n`;
  if (mode === "end-of-note") {
    const lastLine = editor.lastLine();
    editor.replaceRange(insertion, { line: lastLine + 1, ch: 0 });
    return;
  }
  editor.replaceSelection(insertion);
}

export function cursorOffset(editor: Editor): number {
  return editor.posToOffset(editor.getCursor());
}
