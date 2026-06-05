import { AIProvider } from "./base";
import { GeminiProvider } from "./gemini";
import { ProviderConfig, ProviderID, UmpireSettings } from "../types";

class UnsupportedProvider implements AIProvider {
  readonly id: string;
  readonly name: string;

  constructor(id: ProviderID) {
    this.id = id;
    this.name = id;
  }

  async validate(): Promise<boolean> {
    return false;
  }

  async generate(): Promise<never> {
    throw new Error("Umpire: only Gemini generation is available in the MVP.");
  }
}

export function getProvider(id: ProviderID, settings: UmpireSettings): AIProvider {
  if (id === "gemini") {
    return new GeminiProvider(settings.providers.gemini as ProviderConfig);
  }
  return new UnsupportedProvider(id);
}
