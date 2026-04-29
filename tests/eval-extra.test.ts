/**
 * Testes para runEval — src/core/eval.ts
 */

jest.mock('../src/core/generator', () => ({
  generatePrompt: jest.fn(),
}));

import { runEval } from '../src/core/eval';
import { generatePrompt } from '../src/core/generator';

const mockGenerate = generatePrompt as jest.Mock;

const originalStdout = process.stdout.write.bind(process.stdout);
beforeEach(() => {
  jest.clearAllMocks();
  process.stdout.write = jest.fn() as any;
});
afterEach(() => { process.stdout.write = originalStdout; });

describe('runEval', () => {
  it('retorna um resultado por objetivo', async () => {
    mockGenerate
      .mockResolvedValueOnce('baseline prompt 1')
      .mockResolvedValueOnce('finetuned prompt 1')
      .mockResolvedValueOnce('baseline prompt 2')
      .mockResolvedValueOnce('finetuned prompt 2');

    const results = await runEval(['objetivo 1', 'objetivo 2']);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      goal: 'objetivo 1',
      baseline: 'baseline prompt 1',
      finetuned: 'finetuned prompt 1',
    });
  });

  it('chama generatePrompt duas vezes por objetivo (baseline + finetuned)', async () => {
    mockGenerate.mockResolvedValue('prompt');
    await runEval(['objetivo 1', 'objetivo 2']);
    expect(mockGenerate).toHaveBeenCalledTimes(4);
  });

  it('define AI_MODEL para baseline e finetuned em sequência', async () => {
    mockGenerate.mockImplementation(() => Promise.resolve(process.env.AI_MODEL ?? ''));

    const results = await runEval(['objetivo'], 'llama3.2', 'prompt-generator');

    expect(results[0].baseline).toBe('llama3.2');
    expect(results[0].finetuned).toBe('prompt-generator');
  });

  it('retorna array vazio para lista de objetivos vazia', async () => {
    const results = await runEval([]);
    expect(results).toEqual([]);
    expect(mockGenerate).not.toHaveBeenCalled();
  });
});
