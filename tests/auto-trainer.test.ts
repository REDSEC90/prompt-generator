import { AutoTrainer } from '../src/core/auto-trainer';
import { FeedbackStore } from '../src/core/store';
import { callOllamaSilent } from '../src/core/ai';

jest.mock('../src/core/ai');

describe('AutoTrainer', () => {
  let trainer: AutoTrainer;
  let store: FeedbackStore;

  beforeEach(() => {
    trainer = new AutoTrainer();
    store = new FeedbackStore();
    store.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    store.clear();
  });

  describe('runTrainingLoop', () => {
    it('deve executar número correto de iterações', async () => {
      (callOllamaSilent as jest.Mock).mockResolvedValue('Resposta mock com jwt verify token middleware function');

      const metrics = await trainer.runTrainingLoop(3, 100);

      expect(metrics.totalRuns).toBeGreaterThanOrEqual(3);
      expect(callOllamaSilent).toHaveBeenCalledTimes(3);
    });

    it('deve salvar feedback no histórico', async () => {
      (callOllamaSilent as jest.Mock).mockResolvedValue('Mock response with expected keywords');

      await trainer.runTrainingLoop(2, 100);

      const history = store.load();
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0]).toHaveProperty('rating');
      expect(history[0]).toHaveProperty('usedVariation');
    });

    it('deve calcular métricas corretamente', async () => {
      (callOllamaSilent as jest.Mock).mockResolvedValue('Complete response with all expected keywords and proper length for testing purposes');

      const metrics = await trainer.runTrainingLoop(5, 100);

      expect(metrics).toHaveProperty('totalRuns');
      expect(metrics).toHaveProperty('avgRating');
      expect(metrics).toHaveProperty('categoryDistribution');
      expect(metrics).toHaveProperty('variationPerformance');
      expect(metrics).toHaveProperty('improvementRate');
    });
  });

  describe('evaluateResponse', () => {
    it('deve dar rating alto para resposta completa', () => {
      const scenario = {
        theme: 'test',
        action: 'test',
        category: 'code' as const,
        audience: 'test',
        objective: 'test',
        tone: 'technical' as const,
        format: 'code' as const,
        expectedKeywords: ['jwt', 'verify', 'token'],
        minLength: 100,
      };

      const response = '```typescript\nfunction verifyJWT(token: string) {\n  // JWT verification logic\n  return jwt.verify(token, secret);\n}\n```\n\nThis function handles JWT token verification with proper error handling.';

      const rating = (trainer as any).evaluateResponse(response, scenario);

      expect(rating).toBeGreaterThanOrEqual(4);
    });

    it('deve dar rating baixo para resposta inadequada', () => {
      const scenario = {
        theme: 'test',
        action: 'test',
        category: 'code' as const,
        audience: 'test',
        objective: 'test',
        tone: 'technical' as const,
        format: 'code' as const,
        expectedKeywords: ['jwt', 'verify', 'token'],
        minLength: 100,
      };

      const response = 'Short response';

      const rating = (trainer as any).evaluateResponse(response, scenario);

      expect(rating).toBeLessThanOrEqual(2);
    });
  });

  describe('selectBestVariation', () => {
    it('deve retornar contextual quando histórico vazio', () => {
      const variation = (trainer as any).selectBestVariation('code', []);

      expect(variation).toBe('contextual');
    });

    it('deve selecionar variação com melhor rating', () => {
      const history = [
        {
          config: { category: 'code' },
          rating: 5,
          usedVariation: 'chainOfThought',
          generatedPrompt: 'test',
          timestamp: Date.now(),
        },
        {
          config: { category: 'code' },
          rating: 3,
          usedVariation: 'direct',
          generatedPrompt: 'test',
          timestamp: Date.now(),
        },
        {
          config: { category: 'code' },
          rating: 4,
          usedVariation: 'chainOfThought',
          generatedPrompt: 'test',
          timestamp: Date.now(),
        },
      ];

      const variation = (trainer as any).selectBestVariation('code', history);

      expect(variation).toBe('chainOfThought');
    });
  });

  describe('detectFailureReason', () => {
    const scenario = {
      theme: 'test',
      action: 'test',
      category: 'code' as const,
      audience: 'test',
      objective: 'test',
      tone: 'technical' as const,
      format: 'code' as const,
      expectedKeywords: ['jwt', 'verify'],
      minLength: 100,
    };

    it('deve detectar too_vague para resposta muito curta', () => {
      const reason = (trainer as any).detectFailureReason('short', scenario);
      expect(reason).toBe('too_vague');
    });

    it('deve detectar missing_context quando faltam keywords', () => {
      const response = 'A long response without any of the expected keywords that should be present in the output';
      const reason = (trainer as any).detectFailureReason(response, scenario);
      expect(reason).toBe('missing_context');
    });

    it('deve detectar wrong_format para code sem backticks', () => {
      const response = 'function test() { return jwt.verify(token); } This is a long enough response with keywords';
      const reason = (trainer as any).detectFailureReason(response, scenario);
      expect(reason).toBe('wrong_format');
    });
  });
});
