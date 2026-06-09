import { Editor, Notice, Plugin } from "obsidian";
import { briefToFactionlog } from "./brief";
import { insertText, cursorOffset } from "./editor";
import { getFrontMatter } from "./frontmatter";
import { formatAction, formatActorRegistration, formatAdjudication, formatDice, formatForceOfNature, formatLeverageGrade } from "./factionlog/formatter";
import { findActionBlockAt, parseActionBlock, parseAdjudicationDraft, parseBoardState, parseDiceResult, parseLeverageGrade, serializeBoardState } from "./factionlog/parser";
import { ActionSubmissionModal, ActorRegistrationModal, AdjudicationReviewModal, BriefPitchModal, LeverageConfirmModal, ReviewTextModal } from "./modals";
import { getProvider } from "./providers";
import { AIProvider } from "./providers/base";
import { DEFAULT_SETTINGS, UmpireSettingTab } from "./settings";
import { AdjudicationDraft, DiceResult, FactionAction, LeverageGrade, NoteFrontMatter, ProviderID, UmpireSettings } from "./types";
import { adjudicationPrompt, briefPrompt, buildContext, buildSystemPrompt, forceOfNaturePrompt, leveragePrompt, reportPrompt } from "./promptBuilder";

export default class UmpirePlugin extends Plugin {
  settings: UmpireSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new UmpireSettingTab(this.app, this));

    this.addCommand({
      id: "submit-action",
      name: "Submit Action",
      editorCallback: (editor) => {
        new ActionSubmissionModal(this.app, (action) => {
          insertText(editor, formatAction(action, this.settings.wrapInCodeBlocks), this.settings.insertionMode);
        }).open();
      },
    });

    this.addCommand({
      id: "register-actor",
      name: "Register Actor",
      editorCallback: (editor) => {
        new ActorRegistrationModal(this.app, (actor) => {
          insertText(editor, formatActorRegistration(actor, this.settings.wrapInCodeBlocks), this.settings.insertionMode);
        }).open();
      },
    });

    this.addCommand({
      id: "generate-brief",
      name: "Generate Brief",
      editorCallback: (editor, view) => {
        new BriefPitchModal(this.app, async (pitch) => {
          const setup = this.getGenerationSetup(view.file ? getFrontMatter(this.app, view.file) : {});
          if (!setup) return;
          try {
            const response = await setup.provider.generate({
              systemPrompt: buildSystemPrompt(setup.frontMatter),
              userMessage: briefPrompt(pitch),
              model: setup.model,
              temperature: setup.temperature,
              maxOutputTokens: 3500,
            });
            new ReviewTextModal(this.app, "Review Brief", response.text, "Insert", (value) => {
              insertText(editor, value.trim(), this.settings.insertionMode);
            }).open();
            this.noticeTokens(response);
          } catch (error) {
            console.error(error);
            new Notice("Umpire: generation failed. Check settings and network access.");
          }
        }).open();
      },
    });

    this.addCommand({
      id: "brief-to-log",
      name: "Brief To Log",
      editorCallback: (editor) => {
        const source = editor.getSelection().trim() || editor.getValue();
        const log = briefToFactionlog(source, this.settings.wrapInCodeBlocks);
        if (!log) {
          new Notice("Umpire: no parseable private brief sections found.");
          return;
        }
        insertText(editor, log, this.settings.insertionMode);
      },
    });

    this.addCommand({
      id: "grade-action",
      name: "Grade Action",
      editorCallback: async (editor, view) => {
        const action = this.getCurrentAction(editor);
        if (!action) return;
        const setup = this.getGenerationSetup(view.file ? getFrontMatter(this.app, view.file) : {});
        if (!setup) return;
        try {
          const context = await this.contextForNote(setup.frontMatter, editor.getValue());
          const response = await setup.provider.generate({
            systemPrompt: buildSystemPrompt(setup.frontMatter),
            userMessage: leveragePrompt(context, action),
            model: setup.model,
            temperature: setup.temperature,
            maxOutputTokens: 500,
          });
          const suggested = /^Weak\b/i.test(response.text.trim()) ? "Weak" : "Strong";
          new LeverageConfirmModal(this.app, suggested, response.text, (grade) => {
            insertText(editor, formatLeverageGrade(grade), this.settings.insertionMode);
          }).open();
          this.noticeTokens(response);
        } catch (error) {
          console.error(error);
          new Notice("Umpire: generation failed. Check settings and network access.");
        }
      },
    });

    this.addCommand({
      id: "roll-dice",
      name: "Roll Dice",
      editorCallback: (editor) => {
        const block = this.currentTextBlock(editor);
        const grade = parseLeverageGrade(block);
        if (!grade) {
          new Notice("Umpire: add or select a leverage grade before rolling.");
          return;
        }
        insertText(editor, formatDice(rollDice(grade)), this.settings.insertionMode);
      },
    });

    this.addCommand({
      id: "draft-adjudication",
      name: "Draft Adjudication",
      editorCallback: async (editor, view) => {
        const action = this.getCurrentAction(editor);
        if (!action) return;
        const block = this.currentTextBlock(editor);
        const grade = parseLeverageGrade(block);
        const dice = parseDiceResult(block);
        if (!grade) {
          new Notice("Umpire: add or select a leverage grade before rolling.");
          return;
        }
        if (!dice) {
          new Notice("Umpire: roll dice before drafting adjudication.");
          return;
        }
        const setup = this.getGenerationSetup(view.file ? getFrontMatter(this.app, view.file) : {});
        if (!setup) return;
        try {
          const context = await this.contextForNote(setup.frontMatter, editor.getValue());
          const response = await setup.provider.generate({
            systemPrompt: buildSystemPrompt(setup.frontMatter),
            userMessage: adjudicationPrompt(context, action, grade, dice),
            model: setup.model,
            temperature: setup.temperature,
            maxOutputTokens: 800,
          });
          const draft = parseAdjudicationDraft(response.text);
          new AdjudicationReviewModal(this.app, draft.outcome, draft.consequences.join("\n"), (outcome, consequences) => {
            insertText(editor, formatAdjudication({ outcome, consequences: consequences.split("\n").filter(Boolean) }), this.settings.insertionMode);
          }).open();
          this.noticeTokens(response);
        } catch (error) {
          console.error(error);
          new Notice("Umpire: generation failed. Check settings and network access.");
        }
      },
    });

    this.addCommand({
      id: "draft-force-of-nature",
      name: "Draft Force of Nature",
      editorCallback: async (editor, view) => {
        const block = this.currentTextBlock(editor);
        const dice = parseDiceResult(block);
        if (!dice?.isDoubles) {
          new Notice("Umpire: select a dice result with doubles first.");
          return;
        }
        const setup = this.getGenerationSetup(view.file ? getFrontMatter(this.app, view.file) : {});
        if (!setup) return;
        try {
          const context = await this.contextForNote(setup.frontMatter, editor.getValue());
          const response = await setup.provider.generate({
            systemPrompt: buildSystemPrompt(setup.frontMatter),
            userMessage: forceOfNaturePrompt(context, dice),
            model: setup.model,
            temperature: setup.temperature,
            maxOutputTokens: 400,
          });
          new ReviewTextModal(this.app, "Review Force of Nature", response.text, "Insert", (value) => {
            const formatted = formatForceOfNature(value);
            if (formatted) insertText(editor, formatted, this.settings.insertionMode);
          }).open();
          this.noticeTokens(response);
        } catch (error) {
          console.error(error);
          new Notice("Umpire: generation failed. Check settings and network access.");
        }
      },
    });

    this.addCommand({
      id: "draft-turn-report",
      name: "Draft Turn Report",
      editorCallback: async (editor, view) => {
        const turnBlock = currentTurnBlock(editor.getValue(), cursorOffset(editor));
        const setup = this.getGenerationSetup(view.file ? getFrontMatter(this.app, view.file) : {});
        if (!setup) return;
        try {
          const context = await this.contextForNote(setup.frontMatter, editor.getValue());
          const response = await setup.provider.generate({
            systemPrompt: buildSystemPrompt(setup.frontMatter),
            userMessage: reportPrompt(context, turnBlock),
            model: setup.model,
            temperature: setup.temperature,
            maxOutputTokens: 900,
          });
          new ReviewTextModal(this.app, "Review Turn Report", response.text, "Insert", (value) => {
            insertText(editor, value.trim(), this.settings.insertionMode);
          }).open();
          this.noticeTokens(response);
        } catch (error) {
          console.error(error);
          new Notice("Umpire: generation failed. Check settings and network access.");
        }
      },
    });
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.providers = Object.assign({}, DEFAULT_SETTINGS.providers, this.settings.providers);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private getCurrentAction(editor: Editor): FactionAction | null {
    const action = parseActionBlock(this.currentTextBlock(editor));
    if (!action) new Notice("Umpire: select or place the cursor in a parseable Factionlog action.");
    return action;
  }

  private currentTextBlock(editor: Editor): string {
    const selection = editor.getSelection();
    if (selection.trim()) return selection;
    return findActionBlockAt(editor.getValue(), cursorOffset(editor)) ?? "";
  }

  private getGenerationSetup(frontMatter: NoteFrontMatter): { provider: AIProvider; frontMatter: NoteFrontMatter; model: string; temperature: number } | null {
    const providerId = (frontMatter.provider ?? this.settings.activeProvider) as ProviderID;
    if (providerId !== "gemini") {
      new Notice("Umpire: only Gemini generation is available in the MVP.");
      return null;
    }
    if (!this.settings.providers.gemini.apiKey?.trim()) {
      new Notice("Umpire: add a Gemini API key in settings.");
      return null;
    }
    return {
      provider: getProvider(providerId, this.settings),
      frontMatter,
      model: frontMatter.model ?? this.settings.providers.gemini.defaultModel,
      temperature: frontMatter.temperature ?? this.settings.defaultTemperature,
    };
  }

  private async contextForNote(frontMatter: NoteFrontMatter, note: string): Promise<string> {
    const boardState = frontMatter.board_context?.trim()
      ? frontMatter.board_context.trim()
      : serializeBoardState(parseBoardState(note, this.settings.contextDepthLines));
    return buildContext(frontMatter, boardState);
  }

  private noticeTokens(response: { inputTokens?: number; outputTokens?: number }): void {
    if (this.settings.showTokenCount) {
      new Notice(`Umpire: ${response.inputTokens ?? "?"} input / ${response.outputTokens ?? "?"} output tokens.`);
    }
  }
}

function rollDice(grade: LeverageGrade): DiceResult {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return {
    die1,
    die2,
    kept: grade === "Strong" ? Math.max(die1, die2) : Math.min(die1, die2),
    grade,
    isDoubles: die1 === die2,
  };
}


function currentTurnBlock(text: string, offset: number): string {
  const lines = text.split("\n");
  let charCount = 0;
  let cursorLine = 0;
  for (let i = 0; i < lines.length; i += 1) {
    charCount += lines[i].length + 1;
    if (charCount >= offset) {
      cursorLine = i;
      break;
    }
  }

  const turnRe = /^\s*(?:\[Turn:[^\]]+\]|#{1,6}\s+Turn\b)/i;
  let start = 0;
  for (let i = cursorLine; i >= 0; i -= 1) {
    if (turnRe.test(lines[i])) {
      start = i;
      break;
    }
  }

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (turnRe.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n");
}
