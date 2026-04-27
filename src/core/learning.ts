import { PromptConfig, Category } from './types';

export interface PromptFeedback {
  config: PromptConfig;
  rating: 1 | 2 | 3 | 4 | 5;
  usedVariation: 'direct' | 'contextual' | 'chainOfThought';
  timestamp: number;
}

export interface LearningInsight {
  category: Category;
  bestVariation: 'direct' | 'contextual' | 'chainOfThought';
  avgRating: number;
  totalSamples: number;
  suggestions: string[];
}

/**
 * LearningEngine — acumula feedback de prompts gerados e deriva insights
 * para melhorar configurações futuras.
 *
 * Stateless por design: recebe o histórico completo a cada chamada,
 * sem dependência de I/O ou estado global.
 */
export class LearningEngine {
  /**
   * Analisa o histórico e retorna insights por categoria.
   * Requer ao menos 2 amostras por categoria para gerar sugestões.
   */
  analyze(history: PromptFeedback[]): LearningInsight[] {
    const byCategory = new Map<Category, PromptFeedback[]>();

    for (const fb of history) {
      const list = byCategory.get(fb.config.category) ?? [];
      list.push(fb);
      byCategory.set(fb.config.category, list);
    }

    const insights: LearningInsight[] = [];

    for (const [category, samples] of byCategory) {
      if (samples.length < 2) continue;

      const avgByVariation = this.avgRatingByVariation(samples);
      const bestVariation = this.bestKey(avgByVariation);
      const avgRating = samples.reduce((s, f) => s + f.rating, 0) / samples.length;

      insights.push({
        category,
        bestVariation,
        avgRating: parseFloat(avgRating.toFixed(2)),
        totalSamples: samples.length,
        suggestions: this.buildSuggestions(samples, avgByVariation, avgRating),
      });
    }

    return insights.sort((a, b) => b.totalSamples - a.totalSamples);
  }

  /**
   * Sugere ajustes no config com base no histórico da mesma categoria.
   * Retorna o config original se não houver dados suficientes.
   */
  suggest(config: PromptConfig, history: PromptFeedback[]): Partial<PromptConfig> {
    const relevant = history.filter(f => f.config.category === config.category);
    if (relevant.length < 2) return {};

    const avgByVariation = this.avgRatingByVariation(relevant);
    const best = this.bestKey(avgByVariation);

    // Se CoT tem melhor rating, ativar chainOfThought
    const chainOfThought = best === 'chainOfThought' ? true : undefined;

    // Formato mais frequente nos prompts bem avaliados (rating >= 4)
    const topRated = relevant.filter(f => f.rating >= 4);
    const format = topRated.length > 0
      ? this.mostFrequent(topRated.map(f => f.config.format))
      : undefined;

    const patch: Partial<PromptConfig> = {};
    if (chainOfThought !== undefined) patch.chainOfThought = chainOfThought;
    if (format) patch.format = format;
    return patch;
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private avgRatingByVariation(
    samples: PromptFeedback[],
  ): Record<'direct' | 'contextual' | 'chainOfThought', number> {
    const sums: Record<string, number> = { direct: 0, contextual: 0, chainOfThought: 0 };
    const counts: Record<string, number> = { direct: 0, contextual: 0, chainOfThought: 0 };

    for (const f of samples) {
      sums[f.usedVariation] += f.rating;
      counts[f.usedVariation]++;
    }

    return {
      direct:         counts.direct         > 0 ? sums.direct / counts.direct : 0,
      contextual:     counts.contextual     > 0 ? sums.contextual / counts.contextual : 0,
      chainOfThought: counts.chainOfThought > 0 ? sums.chainOfThought / counts.chainOfThought : 0,
    };
  }

  private bestKey(
    map: Record<'direct' | 'contextual' | 'chainOfThought', number>,
  ): 'direct' | 'contextual' | 'chainOfThought' {
    return (Object.entries(map) as [keyof typeof map, number][])
      .reduce((best, cur) => (cur[1] > best[1] ? cur : best))[0];
  }

  private mostFrequent<T>(arr: T[]): T {
    const freq = new Map<T, number>();
    for (const v of arr) freq.set(v, (freq.get(v) ?? 0) + 1);
    return [...freq.entries()].reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  }

  private buildSuggestions(
    samples: PromptFeedback[],
    avgByVariation: Record<string, number>,
    avgRating: number,
  ): string[] {
    const suggestions: string[] = [];

    if (avgRating < 3) {
      suggestions.push('Rating médio baixo — considere revisar action e objective.');
    }

    if (avgByVariation.chainOfThought > avgByVariation.direct + 0.5) {
      suggestions.push('Variação chainOfThought supera direct em +0.5 — ative chainOfThought por padrão.');
    }

    if (avgByVariation.direct > avgByVariation.contextual) {
      suggestions.push('Prompts diretos performam melhor — reduza campos opcionais.');
    }

    const withFewShot = samples.filter(f => f.config.fewShot);
    if (withFewShot.length > 0) {
      const avgFewShot = withFewShot.reduce((s, f) => s + f.rating, 0) / withFewShot.length;
      const withoutFewShot = samples.filter(f => !f.config.fewShot);
      const avgWithout = withoutFewShot.length > 0
        ? withoutFewShot.reduce((s, f) => s + f.rating, 0) / withoutFewShot.length
        : 0;
      if (avgFewShot > avgWithout + 0.5) {
        suggestions.push('Few-shot examples melhoram o rating — inclua exemplos sempre que possível.');
      }
    }

    return suggestions;
  }
}
