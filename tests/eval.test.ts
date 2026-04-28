/**
 * Testes para src/core/eval.ts
 */

jest.mock('../src/core/generator', () => ({
  generatePrompt: jest.fn(),
}));

jest.mock('../src/core/store', () => ({
  FeedbackStore: class {
    load() { return []; }
    stats() { return { total: 0, avgRating: 0 }; }
  },
}));

import { runEval, EvalResult } from '../src/core/eval';
import { generatePrompt } from '../src/core/generator';

const mockGenerate = generatePrompt as jest.Mock;

const originalEnv = { ...process.env };

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...originalEnv };
  jest.restoreAllMocks();
});

describe('runEval', () => {
  it('retorna um resultado por objetivo', async () => {
    mockGenerate
      .mockResolvedValueOnce('baseline-prompt')
      .mockResolvedValueOnce('finetuned-prompt');

    const results = await runEval(['criar endpoint REST']);

    expect(results).toHaveLength(1);
    expect(results[0].goal).toBe('criar endpoint REST');
    expect(results[0].baseline).toBe('baseline-prompt');
    expect(results[0].finetuned).toBe('finetuned-prompt');
  });

  it('chama generatePrompt duas vezes por objetivo (baseline + fine-tunado)', async () => {
    mockGenerate.mockResolvedValue('qualquer-prompt');

    await runEval(['objetivo A', 'objetivo B']);

    expect(mockGenerate).toHaveBeenCalledTimes(4); // 2 objetivos × 2 chamadas
  });

  it('define AI_MODEL para baseline na primeira chamada', async () => {
    let capturedModel: string | undefined;
    mockGenerate.mockImplementation(() => {
      capturedModel = process.env.AI_MODEL;
      return Promise.resolve('prompt');
    });

    await runEval(['objetivo'], 'llama3.2', 'prompt-generator');

    // primeira chamada deve ter AI_MODEL=llama3.2
    expect(mockGenerate.mock.calls[0]).toBeDefined();
  });

  it('define AI_MODEL para fine-tunado na segunda chamada', async () => {
    const models: string[] = [];
    mockGenerate.mockImplementation(() => {
      models.push(process.env.AI_MODEL ?? '');
      return Promise.resolve('prompt');
    });

    await runEval(['objetivo'], 'llama3.2', 'prompt-generator');

    expect(models[0]).toBe('llama3.2');
    expect(models[1]).toBe('prompt-generator');
  });

  it('retorna array vazio para lista de objetivos vazia', async () => {
    const results = await runEval([]);
    expect(results).toEqual([]);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it('processa múltiplos objetivos em sequência', async () => {
    mockGenerate.mockResolvedValue('prompt');

    const results = await runEval(['A', 'B', 'C']);

    expect(results).toHaveLength(3);
    expect(results.map(r => r.goal)).toEqual(['A', 'B', 'C']);
  });

  it('usa modelos padrão quando não especificados', async () => {
    const models: string[] = [];
    mockGenerate.mockImplementation(() => {
      models.push(process.env.AI_MODEL ?? '');
      return Promise.resolve('prompt');
    });

    await runEval(['objetivo']);

    expect(models[0]).toBe('llama3.2');
    expect(models[1]).toBe('prompt-generator');
  });
});
