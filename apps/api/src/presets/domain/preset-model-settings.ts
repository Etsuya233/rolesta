export interface PresetModelSettings {
  contextLength: number | null;
  maxResponseLength: number | null;
  stream: boolean;
  temperature: number | null;
  presencePenalty: number | null;
  frequencyPenalty: number | null;
  repetitionPenalty: number | null;
  topP: number | null;
  topK: number | null;
  minP: number | null;
  topA: number | null;
  seed: number | null;
  n: number | null;
  reasoningEffort: string;
  verbosity: string;
  showThoughts: boolean;
}

export function createDefaultPresetModelSettings(): PresetModelSettings {
  return {
    contextLength: null,
    maxResponseLength: null,
    stream: true,
    temperature: null,
    presencePenalty: null,
    frequencyPenalty: null,
    repetitionPenalty: null,
    topP: null,
    topK: null,
    minP: null,
    topA: null,
    seed: null,
    n: null,
    reasoningEffort: '',
    verbosity: '',
    showThoughts: false,
  };
}
