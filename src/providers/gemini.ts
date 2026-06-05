import { AIProvider } from "./base";
import { GenerationRequest, GenerationResponse, ProviderConfig } from "../types";

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  error?: {
    message?: string;
  };
}

export class GeminiProvider implements AIProvider {
  readonly id = "gemini";
  readonly name = "Gemini";
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  async validate(): Promise<boolean> {
    return Boolean(this.config.apiKey?.trim());
  }

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    if (!(await this.validate())) {
      throw new Error("Missing Gemini API key");
    }

    const model = encodeURIComponent(request.model || this.config.defaultModel);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(this.config.apiKey ?? "")}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: request.systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: request.userMessage }],
          },
        ],
        generationConfig: {
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
        },
      }),
    });

    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      throw new Error(data.error?.message ?? `Gemini request failed: ${response.status}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    return {
      text,
      inputTokens: data.usageMetadata?.promptTokenCount,
      outputTokens: data.usageMetadata?.candidatesTokenCount,
    };
  }
}
