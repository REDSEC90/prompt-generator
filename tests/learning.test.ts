import { LearningEngine, PromptFeedback } from '../src/core/learning';
import { PromptConfig } from '../src/core/types';

const BASE: PromptConfig = {
  action:    'Analise',
  theme:     'React vs Vue',
  format:    'table',
  audience:  'dev sênior',
  objective: 'escolha de framework',
  tone:      'technical',
  category:  'analysis',
};

function fb(
  overrides: Partial<PromptConfig>,
  rating: PromptFeedback['rating'],
  usedVariation: PromptFeedback['usedVariation'],
): PromptFeedback {
  return { config: { ...BASE, ...overrides }, rating, usedVariation, timestamp: Date.now(), generatedPrompt: '' };
}

describe('LearningEngine.analyze', () => {
  const engine = new LearningEngine();

  it('retorna array vazio para histórico vazio', () => {
    expect(engine.analyze([])).toEqual([]);
  });

  it('ignora categorias com menos de 2 amostras', () => {
    const history = [fb({}, 5, 'direct')];
    expect(engine.analyze(history)).toEqual([]);
  });

  it('retorna insight com avgRating correto', () => {
    const history = [
      fb({}, 4, 'direct'),
      fb({}, 2, 'direct'),
    ];
    const [insight] = engine.analyze(history);
    expect(insight.avgRating).toBe(3);
    expect(insight.totalSamples).toBe(2);
    expect(insight.category).toBe('analysis');
  });

  it('identifica bestVariation como chainOfThought quando tem maior média', () => {
    const history = [
      fb({}, 2, 'direct'),
      fb({}, 2, 'contextual'),
      fb({}, 5, 'chainOfThought'),
      fb({}, 5, 'chainOfThought'),
    ];
    const [insight] = engine.analyze(history);
    expect(insight.bestVariation).toBe('chainOfThought');
  });

  it('identifica bestVariation como direct quando tem maior média', () => {
    const history = [
      fb({}, 5, 'direct'),
      fb({}, 5, 'direct'),
      fb({}, 2, 'chainOfThought'),
      fb({}, 2, 'contextual'),
    ];
    const [insight] = engine.analyze(history);
    expect(insight.bestVariation).toBe('direct');
  });

  it('gera sugestão de chainOfThought quando supera direct em +0.5', () => {
    const history = [
      fb({}, 2, 'direct'),
      fb({}, 5, 'chainOfThought'),
      fb({}, 5, 'chainOfThought'),
    ];
    const [insight] = engine.analyze(history);
    expect(insight.suggestions.some(s => s.includes('chainOfThought'))).toBe(true);
  });

  it('gera sugestão de rating baixo quando avgRating < 3', () => {
    const history = [
      fb({}, 1, 'direct'),
      fb({}, 2, 'contextual'),
    ];
    const [insight] = engine.analyze(history);
    expect(insight.suggestions.some(s => s.includes('Rating médio baixo'))).toBe(true);
  });

  it('gera sugestão de few-shot quando melhora rating em +0.5', () => {
    const history = [
      fb({ fewShot: { input: 'x', output: 'y' } }, 5, 'contextual'),
      fb({ fewShot: { input: 'a', output: 'b' } }, 5, 'contextual'),
      fb({}, 2, 'contextual'),
      fb({}, 2, 'contextual'),
    ];
    const [insight] = engine.analyze(history);
    expect(insight.suggestions.some(s => s.includes('Few-shot'))).toBe(true);
  });

  it('gera sugestão de reduzir campos quando direct > contextual', () => {
    const history = [
      fb({}, 5, 'direct'),
      fb({}, 5, 'direct'),
      fb({}, 2, 'contextual'),
      fb({}, 2, 'contextual'),
    ];
    const [insight] = engine.analyze(history);
    expect(insight.suggestions.some(s => s.includes('diretos performam melhor'))).toBe(true);
  });

  it('ordena insights por totalSamples decrescente', () => {
    const history = [
      fb({ category: 'summary' }, 4, 'direct'),
      fb({ category: 'summary' }, 4, 'direct'),
      fb({ category: 'code', language: 'Python' }, 3, 'contextual'),
      fb({ category: 'code', language: 'Python' }, 3, 'contextual'),
      fb({ category: 'code', language: 'Python' }, 3, 'contextual'),
    ];
    const insights = engine.analyze(history);
    expect(insights[0].category).toBe('code');
    expect(insights[0].totalSamples).toBe(3);
  });

  it('processa múltiplas categorias independentemente', () => {
    const history = [
      fb({ category: 'summary' }, 5, 'direct'),
      fb({ category: 'summary' }, 3, 'direct'),
      fb({ category: 'marketing' }, 4, 'contextual'),
      fb({ category: 'marketing' }, 4, 'contextual'),
    ];
    const insights = engine.analyze(history);
    expect(insights).toHaveLength(2);
    const cats = insights.map(i => i.category);
    expect(cats).toContain('summary');
    expect(cats).toContain('marketing');
  });
});

describe('LearningEngine.suggest', () => {
  const engine = new LearningEngine();

  it('retorna patch vazio para histórico insuficiente', () => {
    const patch = engine.suggest(BASE, [fb({}, 5, 'direct')]);
    expect(patch).toEqual({});
  });

  it('sugere chainOfThought:true quando CoT tem melhor média', () => {
    const history = [
      fb({}, 2, 'direct'),
      fb({}, 5, 'chainOfThought'),
      fb({}, 5, 'chainOfThought'),
    ];
    const patch = engine.suggest(BASE, history);
    expect(patch.chainOfThought).toBe(true);
  });

  it('não sugere chainOfThought quando direct é melhor', () => {
    const history = [
      fb({}, 5, 'direct'),
      fb({}, 5, 'direct'),
      fb({}, 2, 'chainOfThought'),
    ];
    const patch = engine.suggest(BASE, history);
    expect(patch.chainOfThought).toBeUndefined();
  });

  it('sugere formato mais frequente nos prompts bem avaliados', () => {
    const history = [
      fb({ format: 'markdown' }, 5, 'contextual'),
      fb({ format: 'markdown' }, 4, 'contextual'),
      fb({ format: 'table' }, 2, 'direct'),
    ];
    const patch = engine.suggest(BASE, history);
    expect(patch.format).toBe('markdown');
  });

  it('ignora amostras de outras categorias', () => {
    const history = [
      fb({ category: 'summary' }, 5, 'chainOfThought'),
      fb({ category: 'summary' }, 5, 'chainOfThought'),
      fb({ category: 'summary' }, 5, 'chainOfThought'),
    ];
    // BASE é category:'analysis' — histórico de 'summary' não deve influenciar
    const patch = engine.suggest(BASE, history);
    expect(patch).toEqual({});
  });

  it('retorna patch vazio quando não há padrão claro', () => {
    const history = [
      fb({}, 3, 'direct'),
      fb({}, 3, 'contextual'),
    ];
    const patch = engine.suggest(BASE, history);
    // Sem diferença clara de variação, sem top-rated para formato
    expect(Object.keys(patch).length).toBeLessThanOrEqual(1);
  });
});
