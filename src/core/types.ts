export type Category = 'summary' | 'code' | 'analysis' | 'marketing' | 'brainstorming';

export type OutputFormat = 'markdown' | 'json' | 'table' | 'numbered-list' | 'prose' | 'html' | 'code';

export type Tone = 'formal' | 'friendly' | 'persuasive' | 'didactic' | 'journalistic' | 'technical';

export interface FewShotExample {
  input: string;
  output: string;
}

export interface PromptConfig {
  action: string;
  theme: string;
  format: OutputFormat;
  audience: string;
  objective: string;
  tone: Tone;
  category: Category;
  limit?: string;
  restrictions?: string[];
  fewShot?: FewShotExample;
  chainOfThought?: boolean;
}

export interface GeneratedPrompt {
  direct: string;
  contextual: string;
  chainOfThought: string;
}
