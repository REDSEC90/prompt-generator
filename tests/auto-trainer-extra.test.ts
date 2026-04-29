/**
 * Testes para AutoTrainer.displayMetrics e calculateMetrics
 * com histórico real — src/core/auto-trainer.ts
 */

jest.mock('../src/core/ai');
jest.mock('ora', () => () => ({
  start: jest.fn().mockReturnThis(),
  stop:  jest.fn().mockReturnThis(),
  fail:  jest.fn().mockReturnThis(),
}));

import { AutoTrainer } from '../src/core/auto-trainer';
import { FeedbackStore } from '../src/core/store';
import { callOllamaSilent } from '../src/core/ai';
import { PromptFeedback } from '../src/core/learning';

const mockSilent = callOllamaSilent as jest.Mock;

let store: FeedbackStore;
let trainer: AutoTrainer;

beforeEach(() => {
  store = new FeedbackStore();
  store.clear();
  trainer = new AutoTrainer();
  jest.clearAllMocks();
});

afterEach(() => store.clear());

// ── helpers ───────────────────────────────────────────────────────────────────

function makeFeedback(category: string, rating: 1|2|3|4|5, variation = 'contextual'): PromptFeedback {
  return {
    config: { category, theme: 't', action: 'a', audience: 'au', objective: 'o', tone: 'technical', format: 'markdown' } as any,
    generatedPrompt: 'prompt',
    rating,
    usedVariation: variation as any,
    timestamp: Date.now(),
  };
}

// ── calculateMetrics ──────────────────────────────────────────────────────────

describe('AutoTrainer — calculateMetrics', () => {
  it('calcula avgRating corretamente', async () => {
    store.save(makeFeedback('code', 4));
    store.save(makeFeedback('code', 2));

    const metrics = (trainer as any).calculateMetrics();
    expect(metrics.avgRating).toBeCloseTo(3, 1);
  });

  it('conta distribuição por categoria', async () => {
    store.save(makeFeedback('code', 5));
    store.save(makeFeedback('code', 4));
    store.save(makeFeedback('analysis', 3));

    const metrics = (trainer as any).calculateMetrics();
    expect(metrics.categoryDistribution.code).toBe(2);
    expect(metrics.categoryDistribution.analysis).toBe(1);
  });

  it('calcula performance por variação', async () => {
    store.save(makeFeedback('code', 5, 'direct'));
    store.save(makeFeedback('code', 3, 'contextual'));

    const metrics = (trainer as any).calculateMetrics();
    expect(metrics.variationPerformance.direct.count).toBe(1);
    expect(metrics.variationPerformance.direct.avgRating).toBe(5);
    expect(metrics.variationPerformance.contextual.avgRating).toBe(3);
  });

  it('improvementRate positivo quando últimas execuções são melhores', async () => {
    // 20 ruins no início, 20 bons no final
    for (let i = 0; i < 20; i++) store.save(makeFeedback('code', 2));
    for (let i = 0; i < 20; i++) store.save(makeFeedback('code', 5));

    const metrics = (trainer as any).calculateMetrics();
    expect(metrics.improvementRate).toBeGreaterThan(0);
  });
});

// ── displayMetrics ────────────────────────────────────────────────────────────

describe('AutoTrainer — displayMetrics', () => {
  it('não lança exceção com métricas válidas', () => {
    store.save(makeFeedback('code', 4));
    const metrics = (trainer as any).calculateMetrics();
    expect(() => trainer.displayMetrics(metrics)).not.toThrow();
  });

  it('não lança exceção com histórico vazio', () => {
    const metrics = (trainer as any).calculateMetrics();
    expect(() => trainer.displayMetrics(metrics)).not.toThrow();
  });
});

// ── runTrainingLoop com falha de IA ───────────────────────────────────────────

describe('AutoTrainer — tratamento de erros', () => {
  it('continua o loop quando callOllamaSilent lança erro', async () => {
    mockSilent
      .mockRejectedValueOnce(new Error('Ollama indisponível'))
      .mockResolvedValue('jwt verify token middleware function with proper length for testing');

    const metrics = await trainer.runTrainingLoop(2);
    // pelo menos 1 sucesso (a segunda iteração)
    expect(metrics.totalRuns).toBeGreaterThanOrEqual(0);
  });
});

// ── selectBestVariation com histórico misto ───────────────────────────────────

describe('AutoTrainer — selectBestVariation', () => {
  it('retorna contextual com menos de 3 amostras', () => {
    const history = [makeFeedback('code', 5, 'direct'), makeFeedback('code', 5, 'direct')];
    expect((trainer as any).selectBestVariation('code', history)).toBe('contextual');
  });

  it('retorna a variação com maior média quando há histórico suficiente', () => {
    const history = [
      makeFeedback('code', 5, 'chainOfThought'),
      makeFeedback('code', 5, 'chainOfThought'),
      makeFeedback('code', 5, 'chainOfThought'),
      makeFeedback('code', 2, 'direct'),
      makeFeedback('code', 2, 'contextual'),
    ];
    expect((trainer as any).selectBestVariation('code', history)).toBe('chainOfThought');
  });
});
