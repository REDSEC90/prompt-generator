export type Category = 'summary' | 'code' | 'analysis' | 'marketing' | 'brainstorming';

export type OutputFormat =
  | 'markdown'
  | 'json'
  | 'table'
  | 'numbered-list'
  | 'prose'
  | 'html'
  | 'code';

export type Tone =
  | 'formal'
  | 'friendly'
  | 'persuasive'
  | 'didactic'
  | 'journalistic'
  | 'technical';

export interface FewShotExample {
  input: string;
  output: string;
}

export interface PromptConfig {
  // ── obrigatórios ──────────────────────────────────────────────────────────
  action: string;      // verbo imperativo: "escreva", "compare", "liste"
  theme: string;       // assunto ou escopo da tarefa
  format: OutputFormat;
  audience: string;
  objective: string;
  tone: Tone;
  category: Category;

  // ── opcionais ─────────────────────────────────────────────────────────────
  language?: string;         // linguagem de programação (categoria: code)
  limit?: string;            // ex: "200 palavras", "5 itens"
  restrictions?: string[];   // o que evitar
  fewShot?: FewShotExample;
  chainOfThought?: boolean;
}

export interface GeneratedPrompt {
  direct: string;
  contextual: string;
  chainOfThought: string;
}

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];   // erros bloqueantes (campos obrigatórios ausentes)
}
