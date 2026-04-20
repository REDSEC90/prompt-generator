import { PromptConfig, Category, OutputFormat } from './types';
import TEMPLATES from './templates';

const INCOMPATIBLE: Partial<Record<OutputFormat, Category[]>> = {
  json: ['marketing'],
  code: ['marketing', 'summary', 'analysis', 'brainstorming'],
  table: ['code', 'marketing'],
};

export class TemplateEngine {
  validate(config: PromptConfig): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const incompatible = INCOMPATIBLE[config.format] ?? [];
    if (incompatible.includes(config.category)) {
      warnings.push(`Formato "${config.format}" pode não funcionar bem com categoria "${config.category}".`);
    }
    return { valid: warnings.length === 0, warnings };
  }

  fill(config: PromptConfig): string {
    const template = TEMPLATES[config.category];
    if (!template) throw new Error(`Categoria desconhecida: ${config.category}`);
    return template(config);
  }
}
