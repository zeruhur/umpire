import { App, PluginSettingTab, Setting } from "obsidian";
import UmpirePlugin from "./main";
import { UmpireSettings } from "./types";

export const DEFAULT_SETTINGS: UmpireSettings = {
  activeProvider: "gemini",
  providers: {
    gemini: { apiKey: "", defaultModel: "gemini-2.5-flash" },
    openai: { apiKey: "", defaultModel: "gpt-4.1-mini", baseUrl: "https://api.openai.com/v1" },
    anthropic: { apiKey: "", defaultModel: "claude-3-5-sonnet-latest" },
    ollama: { defaultModel: "llama3.1", baseUrl: "http://localhost:11434" },
  },
  insertionMode: "cursor",
  showTokenCount: false,
  defaultTemperature: 0.7,
  wrapInCodeBlocks: true,
  contextDepthLines: 160,
};

export class UmpireSettingTab extends PluginSettingTab {
  plugin: UmpirePlugin;

  constructor(app: App, plugin: UmpirePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Umpire" });

    new Setting(containerEl)
      .setName("Active provider")
      .setDesc("MVP generation supports Gemini only.")
      .addDropdown((dropdown) => dropdown
        .addOption("gemini", "Gemini")
        .addOption("openai", "OpenAI (post-MVP)")
        .addOption("anthropic", "Anthropic (post-MVP)")
        .addOption("ollama", "Ollama (post-MVP)")
        .setValue(this.plugin.settings.activeProvider)
        .onChange(async (value) => {
          this.plugin.settings.activeProvider = value as UmpireSettings["activeProvider"];
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Gemini API key")
      .addText((text) => text
        .setPlaceholder("AIza...")
        .setValue(this.plugin.settings.providers.gemini.apiKey ?? "")
        .onChange(async (value) => {
          this.plugin.settings.providers.gemini.apiKey = value.trim();
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Gemini model")
      .addText((text) => text
        .setValue(this.plugin.settings.providers.gemini.defaultModel)
        .onChange(async (value) => {
          this.plugin.settings.providers.gemini.defaultModel = value.trim() || "gemini-2.5-flash";
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Insertion mode")
      .addDropdown((dropdown) => dropdown
        .addOption("cursor", "Cursor")
        .addOption("end-of-note", "End of note")
        .setValue(this.plugin.settings.insertionMode)
        .onChange(async (value) => {
          this.plugin.settings.insertionMode = value as UmpireSettings["insertionMode"];
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Wrap notation in code blocks")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.wrapInCodeBlocks)
        .onChange(async (value) => {
          this.plugin.settings.wrapInCodeBlocks = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Context depth lines")
      .addText((text) => text
        .setValue(String(this.plugin.settings.contextDepthLines))
        .onChange(async (value) => {
          const parsed = Number.parseInt(value, 10);
          this.plugin.settings.contextDepthLines = Number.isFinite(parsed) ? Math.max(20, parsed) : 160;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Default temperature")
      .addSlider((slider) => slider
        .setLimits(0, 1, 0.05)
        .setValue(this.plugin.settings.defaultTemperature)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.defaultTemperature = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Show token counts")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.showTokenCount)
        .onChange(async (value) => {
          this.plugin.settings.showTokenCount = value;
          await this.plugin.saveSettings();
        }));
  }
}
