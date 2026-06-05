export type ProviderID = "gemini" | "openai" | "anthropic" | "ollama";
export type LeverageGrade = "Strong" | "Weak";
export type InsertionMode = "cursor" | "end-of-note";

export interface ProviderConfig {
  apiKey?: string;
  defaultModel: string;
  baseUrl?: string;
}

export interface UmpireSettings {
  activeProvider: ProviderID;
  providers: Record<ProviderID, ProviderConfig>;
  insertionMode: InsertionMode;
  showTokenCount: boolean;
  defaultTemperature: number;
  wrapInCodeBlocks: boolean;
  contextDepthLines: number;
}

export interface NoteFrontMatter {
  title?: string;
  system?: string;
  factions?: string[];
  npas?: string[];
  turn_count?: number;
  turns_per_session?: number;
  current_turn?: number;
  current_session?: number;
  board_context?: string;
  provider?: ProviderID;
  model?: string;
  temperature?: number;
  system_prompt_override?: string;
  language?: string;
  sources?: SourceRef[];
}

export interface SourceRef {
  label: string;
  provider: ProviderID;
  mime_type: string;
  file_uri?: string;
  file_id?: string;
  vault_path?: string;
}

export interface BonusSpend {
  name: string;
  before: string;
  after: string;
}

export interface FactionAction {
  factionName: string;
  act: string;
  out: string;
  lev: string;
  bonSpent?: BonusSpend[];
  isNPA: boolean;
  isPrivate?: boolean;
}

export interface DiceResult {
  die1: number;
  die2: number;
  kept: number;
  grade: LeverageGrade;
  isDoubles: boolean;
}

export interface BoardState {
  lastTurnId: string;
  factionTags: Map<string, string>;
  npaTags: Map<string, string>;
  rivalTags: Map<string, string>;
  locationTags: Map<string, string>;
  eventClocks: Map<string, string>;
  objectives: Map<string, string>;
  recentBeats: string[];
}

export interface GenerationRequest {
  systemPrompt: string;
  userMessage: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
}

export interface GenerationResponse {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AdjudicationDraft {
  outcome: string;
  consequences: string[];
}
