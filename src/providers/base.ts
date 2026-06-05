import { GenerationRequest, GenerationResponse } from "../types";

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  generate(request: GenerationRequest): Promise<GenerationResponse>;
  validate(): Promise<boolean>;
}
