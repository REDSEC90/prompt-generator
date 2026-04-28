import { generatePrompt, rewritePrompt } from './generator';
import { FeedbackStore } from './store';
import { PromptFeedback, FailureReason } from './learning';
import { PromptConfig } from './types';

export interface LoopIteration {
  iteration: number;
  prompt: string;
  rating: 1 | 2 | 3 | 4 | 5;
  failureReason?: FailureReason;
  improved: boolean;   // rating melhorou em relação à iteração anterior
}

export interface LoopResult {
  goal: string;
  iterations: LoopIteration[];
  finalPrompt: string;
  finalRating: 1 | 2 | 3 | 4 | 5;
  converged: boolean;  // true se atingiu threshold antes do maxIterations
}

export interface LoopOptions {
  maxIterations?: number;   // padrão: 5
  targetRating?: 1 | 2 | 3 | 4 | 5;  // padrão: 4
}

/**
 * Loop de aprendizado autônomo: gera → avalia → reescreve até convergir.
 *
 * @param goal       - Objetivo em linguagem natural.
 * @param getRating  - Callback que recebe o prompt e retorna { rating, failureReason }.
 *                     Permite injetar avaliação humana ou automática.
 * @param options    - maxIterations e targetRating.
 */
export async function runLoop(
  goal: string,
  getRating: (prompt: string, iteration: number) => Promise<{ rating: 1|2|3|4|5; failureReason?: FailureReason }>,
  options: LoopOptions = {},
): Promise<LoopResult> {
  const maxIterations = options.maxIterations ?? 5;
  const targetRating  = options.targetRating  ?? 4;

  const store   = new FeedbackStore();
  const history = store.load();
  const iterations: LoopIteration[] = [];

  let currentPrompt = await generatePrompt(goal, history);
  let prevRating: number = 0;

  for (let i = 1; i <= maxIterations; i++) {
    const { rating, failureReason } = await getRating(currentPrompt, i);

    const minConfig: PromptConfig = {
      action: 'gerar', theme: goal, format: 'markdown',
      audience: '-', objective: goal, tone: 'technical', category: 'analysis',
    };
    store.save({ config: minConfig, generatedPrompt: currentPrompt, rating, usedVariation: 'direct', failureReason, timestamp: Date.now() } as PromptFeedback);

    iterations.push({
      iteration: i,
      prompt: currentPrompt,
      rating,
      failureReason,
      improved: rating > prevRating,
    });

    if (rating >= targetRating) {
      return { goal, iterations, finalPrompt: currentPrompt, finalRating: rating, converged: true };
    }

    if (i < maxIterations && failureReason) {
      currentPrompt = await rewritePrompt(currentPrompt, failureReason);
    }

    prevRating = rating;
  }

  const last = iterations[iterations.length - 1];
  return { goal, iterations, finalPrompt: last.prompt, finalRating: last.rating, converged: false };
}
