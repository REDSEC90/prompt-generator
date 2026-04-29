/**
 * Testes para RetryManager — src/core/retry.ts
 */

import { RetryManager } from '../src/core/retry';

describe('RetryManager', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('retorna resultado na primeira tentativa bem-sucedida', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await new RetryManager().execute(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retenta em erro de rede e retorna na segunda tentativa', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue('ok');

    const promise = new RetryManager(3, 10).execute(fn);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retenta em erro 429 (rate limit)', async () => {
    const err429 = Object.assign(new Error('HTTP 429'), { status: 429 });
    const fn = jest.fn()
      .mockRejectedValueOnce(err429)
      .mockResolvedValue('ok');

    const promise = new RetryManager(3, 10).execute(fn);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('retenta em erro 503', async () => {
    const err503 = Object.assign(new Error('HTTP 503'), { status: 503 });
    const fn = jest.fn()
      .mockRejectedValueOnce(err503)
      .mockResolvedValue('ok');

    const promise = new RetryManager(3, 10).execute(fn);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('NÃO retenta em erro 400 (bad request)', async () => {
    const err400 = Object.assign(new Error('HTTP 400'), { status: 400 });
    const fn = jest.fn().mockRejectedValue(err400);

    await expect(new RetryManager(3, 10).execute(fn)).rejects.toThrow('HTTP 400');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('NÃO retenta em erro 401 (unauthorized)', async () => {
    const err401 = Object.assign(new Error('HTTP 401'), { status: 401 });
    const fn = jest.fn().mockRejectedValue(err401);

    await expect(new RetryManager(3, 10).execute(fn)).rejects.toThrow('HTTP 401');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('NÃO retenta em AbortError (timeout)', async () => {
    const abortErr = Object.assign(new Error('aborted'), { name: 'AbortError' });
    const fn = jest.fn().mockRejectedValue(abortErr);

    await expect(new RetryManager(3, 10).execute(fn)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('lança o último erro após esgotar todas as tentativas', async () => {
    // Usa baseDelayMs=0 para não precisar de fake timers neste caso
    jest.useRealTimers();
    const fn = jest.fn().mockImplementation(() =>
      Promise.reject(new Error('persistent error')),
    );

    await expect(new RetryManager(2, 0).execute(fn)).rejects.toThrow('persistent error');
    expect(fn).toHaveBeenCalledTimes(3); // 1 inicial + 2 retentativas
    jest.useFakeTimers();
  });

  it('respeita maxRetries=0 (sem retentativas)', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));

    await expect(new RetryManager(0, 10).execute(fn)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
