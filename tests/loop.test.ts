jest.mock('../src/core/generator', () => ({
  generatePrompt: jest.fn(),
  rewritePrompt:  jest.fn(),
}));

jest.mock('../src/core/store', () => ({
  FeedbackStore: class {
    load()  { return []; }
    save()  {}
    stats() { return { total: 0, avgRating: 0 }; }
  },
}));

import { runLoop } from '../src/core/loop';
import { generatePrompt, rewritePrompt } from '../src/core/generator';

const mockGenerate = generatePrompt as jest.Mock;
const mockRewrite  = rewritePrompt  as jest.Mock;

beforeEach(() => jest.resetAllMocks());

describe('runLoop', () => {
  it('converge na primeira iteração quando rating >= target', async () => {
    mockGenerate.mockResolvedValue('prompt-v1');
    const getRating = jest.fn().mockResolvedValue({ rating: 4 });

    const result = await runLoop('objetivo', getRating, { targetRating: 4, maxIterations: 5 });

    expect(result.converged).toBe(true);
    expect(result.finalRating).toBe(4);
    expect(result.iterations).toHaveLength(1);
    expect(mockRewrite).not.toHaveBeenCalled();
  });

  it('reescreve quando rating < target e converge na segunda iteração', async () => {
    mockGenerate.mockResolvedValue('prompt-v1');
    mockRewrite.mockResolvedValue('prompt-v2');
    const getRating = jest.fn()
      .mockResolvedValueOnce({ rating: 2, failureReason: 'too_vague' })
      .mockResolvedValueOnce({ rating: 5 });

    const result = await runLoop('objetivo', getRating, { targetRating: 4, maxIterations: 5 });

    expect(result.converged).toBe(true);
    expect(result.finalRating).toBe(5);
    expect(result.iterations).toHaveLength(2);
    expect(mockRewrite).toHaveBeenCalledWith('prompt-v1', 'too_vague');
    expect(result.iterations[1].prompt).toBe('prompt-v2');
  });

  it('não converge quando esgota maxIterations', async () => {
    mockGenerate.mockResolvedValue('prompt-v1');
    mockRewrite.mockResolvedValue('prompt-vN');
    const getRating = jest.fn().mockResolvedValue({ rating: 2, failureReason: 'wrong_format' });

    const result = await runLoop('objetivo', getRating, { targetRating: 4, maxIterations: 3 });

    expect(result.converged).toBe(false);
    expect(result.iterations).toHaveLength(3);
    expect(mockRewrite).toHaveBeenCalledTimes(2); // não reescreve na última iteração
  });

  it('marca improved=true quando rating sobe', async () => {
    mockGenerate.mockResolvedValue('p1');
    mockRewrite.mockResolvedValue('p2');
    const getRating = jest.fn()
      .mockResolvedValueOnce({ rating: 2, failureReason: 'too_vague' })
      .mockResolvedValueOnce({ rating: 4 });

    const result = await runLoop('objetivo', getRating, { targetRating: 4 });

    expect(result.iterations[0].improved).toBe(true);  // 0 → 2: melhora em relação ao estado inicial
    expect(result.iterations[1].improved).toBe(true);  // 2 → 4
  });

  it('não chama rewritePrompt sem failureReason', async () => {
    mockGenerate.mockResolvedValue('p1');
    const getRating = jest.fn()
      .mockResolvedValueOnce({ rating: 1 })  // sem failureReason
      .mockResolvedValueOnce({ rating: 4 });

    await runLoop('objetivo', getRating, { targetRating: 4, maxIterations: 3 });

    expect(mockRewrite).not.toHaveBeenCalled();
  });

  it('usa defaults: maxIterations=5, targetRating=4', async () => {
    mockGenerate.mockResolvedValue('p1');
    mockRewrite.mockResolvedValue('pN');
    const getRating = jest.fn().mockResolvedValue({ rating: 1, failureReason: 'too_vague' });

    const result = await runLoop('objetivo', getRating);

    expect(result.iterations).toHaveLength(5);
    expect(result.converged).toBe(false);
  });

  it('retorna o prompt da última iteração como finalPrompt quando não converge', async () => {
    mockGenerate.mockResolvedValue('p1');
    mockRewrite.mockResolvedValueOnce('p2').mockResolvedValueOnce('p3');
    const getRating = jest.fn().mockResolvedValue({ rating: 2, failureReason: 'too_vague' });

    const result = await runLoop('objetivo', getRating, { maxIterations: 3 });

    expect(result.finalPrompt).toBe('p3');
  });

  it('persiste cada iteração no FeedbackStore', async () => {
    const { FeedbackStore } = require('../src/core/store');
    const saveSpy = jest.spyOn(FeedbackStore.prototype, 'save');
    mockGenerate.mockResolvedValue('p1');
    const getRating = jest.fn().mockResolvedValue({ rating: 5 });

    await runLoop('objetivo', getRating, { maxIterations: 3 });

    expect(saveSpy).toHaveBeenCalledTimes(1);
  });
});
