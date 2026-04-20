import { Category, OutputFormat, PromptConfig, ValidationResult } from './types';
import TEMPLATES from './templates';

/** Combinações formato × categoria que produzem saídas defeituosas. */
const INCOMPATIBLE: Partial<Record<OutputFormat, Category[]>> = {
  json:  ['marketing'],
  code:  ['marketing', 'summary', 'analysis', 'brainstorming'],
  table: ['code', 'marketing'],
};

/** Campos obrigatórios que não podem ser vazios. */
const REQUIRED: (keyof PromptConfig)[] = ['action', 'theme', 'format', 'audience', 'objective', 'tone', 'category'];

export class TemplateEngine {
  /**
   * Valida um PromptConfig antes da geração.
   * Retorna erros bloqueantes (campos ausentes) e avisos não-bloqueantes
   * (incompatibilidades formato × categoria).
   */
  validate(config: PromptConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const field of REQUIRED) {
      const val = config[field];
      if (val === undefined || val === null || String(val).trim() === '') {
        errors.push(`Campo obrigatório ausente: "${field}".`);
      }
    }

    if (config.category === 'code' && !config.language && !config.theme) {
      errors.push('Categoria "code" requer "language" ou "theme" com a linguagem.');
    }

    const incompatible = INCOMPATIBLE[config.format] ?? [];
    if (incompatible.includes(config.category)) {
      warnings.push(
        `Formato "${config.format}" pode não funcionar bem com categoria "${config.category}".`
      );
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Preenche o template da categoria com os valores do config.
   * @throws {Error} se a categoria não existir ou o config tiver erros bloqueantes.
   */
  fill(config: PromptConfig): string {
    const { valid, errors } = this.validate(config);
    if (!valid) throw new Error(`PromptConfig inválido:\n${errors.join('\n')}`);

    const template = TEMPLATES[config.category];
    if (!template) throw new Error(`Categoria desconhecida: ${config.category}`);
    return template(config);
  }
}
