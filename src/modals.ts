import { App, Modal, Setting } from "obsidian";
import { FactionAction, LeverageGrade } from "./types";

export class ActionSubmissionModal extends Modal {
  private onSubmit: (action: FactionAction) => void;
  private faction = "";
  private act = "";
  private out = "";
  private lev = "";
  private isNPA = false;
  private isPrivate = false;

  constructor(app: App, onSubmit: (action: FactionAction) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Submit Action" });

    new Setting(contentEl).setName("Faction").addText((text) => text.onChange((value) => this.faction = value));
    this.addArea("Action", (value) => this.act = value);
    this.addArea("Desired outcome", (value) => this.out = value);
    this.addArea("Leverage", (value) => this.lev = value);
    new Setting(contentEl).setName("NPA").addToggle((toggle) => toggle.onChange((value) => this.isNPA = value));
    new Setting(contentEl).setName("Private").addToggle((toggle) => toggle.onChange((value) => this.isPrivate = value));
    new Setting(contentEl).addButton((button) => button
      .setButtonText("Insert")
      .setCta()
      .onClick(() => {
        if (!this.faction.trim() || !this.act.trim() || !this.out.trim() || !this.lev.trim()) return;
        this.onSubmit({
          factionName: this.faction.trim(),
          act: this.act.trim(),
          out: this.out.trim(),
          lev: this.lev.trim(),
          isNPA: this.isNPA,
          isPrivate: this.isPrivate,
        });
        this.close();
      }));
  }

  private addArea(name: string, onChange: (value: string) => void): void {
    new Setting(this.contentEl).setName(name).addTextArea((area) => {
      area.inputEl.rows = 4;
      area.onChange(onChange);
    });
  }
}

export class LeverageConfirmModal extends Modal {
  private grade: LeverageGrade;
  private onSubmit: (grade: LeverageGrade) => void;

  constructor(app: App, suggested: LeverageGrade, reasoning: string, onSubmit: (grade: LeverageGrade) => void) {
    super(app);
    this.grade = suggested;
    this.onSubmit = onSubmit;
    this.reasoning = reasoning;
  }

  private reasoning: string;

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Confirm Leverage" });
    contentEl.createEl("p", { text: this.reasoning || "No reasoning returned." });
    new Setting(contentEl)
      .setName("Grade")
      .addDropdown((dropdown) => dropdown
        .addOption("Strong", "Strong")
        .addOption("Weak", "Weak")
        .setValue(this.grade)
        .onChange((value) => this.grade = value as LeverageGrade));
    new Setting(contentEl).addButton((button) => button
      .setButtonText("Insert")
      .setCta()
      .onClick(() => {
        this.onSubmit(this.grade);
        this.close();
      }));
  }
}

export class ReviewTextModal extends Modal {
  private title: string;
  private value: string;
  private onSubmit: (value: string) => void;
  private submitLabel: string;

  constructor(app: App, title: string, initial: string, submitLabel: string, onSubmit: (value: string) => void) {
    super(app);
    this.title = title;
    this.value = initial;
    this.submitLabel = submitLabel;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.title });
    new Setting(contentEl).addTextArea((component) => {
      component.inputEl.rows = 12;
      component.inputEl.cols = 64;
      component.setValue(this.value);
      component.onChange((value) => this.value = value);
      component.inputEl.focus();
    });
    new Setting(contentEl)
      .addButton((button) => button
        .setButtonText("Dismiss")
        .onClick(() => this.close()))
      .addButton((button) => button
        .setButtonText(this.submitLabel)
        .setCta()
        .onClick(() => {
          this.onSubmit(this.value);
          this.close();
        }));
  }
}

export class AdjudicationReviewModal extends Modal {
  private outcome: string;
  private consequences: string;
  private onSubmit: (outcome: string, consequences: string) => void;

  constructor(app: App, outcome: string, consequences: string, onSubmit: (outcome: string, consequences: string) => void) {
    super(app);
    this.outcome = outcome;
    this.consequences = consequences;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Review Adjudication" });
    this.addArea("Outcome", this.outcome, (value) => this.outcome = value);
    this.addArea("Consequences", this.consequences, (value) => this.consequences = value);
    new Setting(contentEl)
      .addButton((button) => button.setButtonText("Dismiss").onClick(() => this.close()))
      .addButton((button) => button.setButtonText("Insert").setCta().onClick(() => {
        this.onSubmit(this.outcome, this.consequences);
        this.close();
      }));
  }

  private addArea(name: string, initial: string, onChange: (value: string) => void): void {
    new Setting(this.contentEl).setName(name).addTextArea((area) => {
      area.inputEl.rows = 6;
      area.setValue(initial);
      area.onChange(onChange);
    });
  }
}
