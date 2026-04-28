jest.mock('../src/core/judge', () => ({ generateAndJudge: jest.fn() }));
jest.mock('../src/core/store', () => ({
  FeedbackStore: class {
    load()  { return []; }
    save()  {}
    stats() { return { total: 0, avgRating: 0 }; }
  },
}));

import { runAutoLoop } from '../src/core/auto-loop';
import { generateAndJudge } from '../src/core/judge';

const mockJudge = generateAndJudge as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => jest.restoreAllMocks());

describe('runAutoLoop', () => {
  it('para após SIGINT e chama onCycle uma vez', async () => {
    mockJudge.mockImplementation(async () => {
      setTimeout(() => process.emit('SIGINT' as any), 10);
      return { rating: 4, critique: 'ok', generatedPrompt: 'p1' };
    });

    const onCycle = jest.fn();
    await runAutoLoop(onCycle, 1, 4);

    expect(onCycle).toHaveBeenCalledTimes(1);
    expect(onCycle.mock.calls[0][0].totalRuns).toBe(1);
  });

  it('marca converged quando rating >= target', async () => {
    mockJudge.mockResolvedValue({ rating: 5, critique: 'excelente', generatedPrompt: 'p' });

    let stats: any;
    await runAutoLoop((s) => {
      stats = s;
      process.emit('SIGINT' as any);
    }, 3, 4);

    expect(stats.convergedRuns).toBe(1);
  });

  it('não marca converged quando rating < target em todas as iterações', async () => {
    mockJudge.mockResolvedValue({ rating: 2, failureReason: 'too_vague', critique: 'ruim', generatedPrompt: 'p' });

    let stats: any;
    await runAutoLoop((s) => {
      stats = s;
      process.emit('SIGINT' as any);
    }, 2, 4);

    expect(stats.convergedRuns).toBe(0);
  });

  it('acumula totalIterations corretamente', async () => {
    let cycle = 0;
    // Ciclo 1: converge na iter 2; Ciclo 2: não converge em 2 iters
    mockJudge
      .mockResolvedValueOnce({ rating: 2, failureReason: 'too_vague', critique: 'ruim', generatedPrompt: 'p1' })
      .mockResolvedValueOnce({ rating: 4, critique: 'ok', generatedPrompt: 'p2' })
      .mockResolvedValue({ rating: 2, failureReason: 'too_vague', critique: 'ruim', generatedPrompt: 'pN' });

    const stats: any[] = [];
    await runAutoLoop((s) => {
      stats.push({ ...s });
      cycle++;
      if (cycle >= 2) process.emit('SIGINT' as any);
    }, 2, 4);

    expect(stats[0].totalIterations).toBe(2); // ciclo 1: 2 iters
    expect(stats[1].totalIterations).toBe(4); // ciclo 2: +2 iters
  });

  it('atualiza bestRating quando encontra prompt melhor', async () => {
    let cycle = 0;
    mockJudge
      .mockResolvedValueOnce({ rating: 3, critique: 'ok', generatedPrompt: 'p1' })
      .mockResolvedValueOnce({ rating: 5, critique: 'excelente', generatedPrompt: 'p2' });

    const stats: any[] = [];
    await runAutoLoop((s) => {
      stats.push({ ...s });
      cycle++;
      if (cycle >= 2) process.emit('SIGINT' as any);
    }, 1, 4);

    expect(stats[0].bestRating).toBe(3);
    expect(stats[1].bestRating).toBe(5);
    expect(stats[1].bestPrompt).toBe('p2');
  });
});
