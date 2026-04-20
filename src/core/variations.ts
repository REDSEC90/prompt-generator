import { PromptConfig, GeneratedPrompt } from './types';
import { TemplateEngine } from './engine';

export class VariationGenerator {
  private engine = new TemplateEngine();

  /**
   * Gera três variações de prompt a partir de um PromptConfig completo:
   * - `direct`        — apenas ação, tema e formato (iteração rápida)
   * - `contextual`    — todos os campos fornecidos, sem CoT
   * - `chainOfThought`— todos os campos + instrução de raciocínio explícito
   */
  generate(config: PromptConfig): GeneratedPrompt {
    const direct = this.engine.fill({
      ...config,
      audience: '-',
      objective: '-',
      restrictions: [],
      fewShot: undefined,
      chainOfThought: false,
    });

    const contextual = this.engine.fill({ ...config, chainOfThought: false });

    const cot = this.engine.fill({ ...config, chainOfThought: true });

    return { direct, contextual, chainOfThought: cot };
  }
}
