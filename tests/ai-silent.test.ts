/**
 * Testes para callOllamaSilent e sendToAIFast — src/core/ai.ts
 */

jest.mock('ora', () => () => ({
  start: jest.fn().mockReturnThis(),
  stop:  jest.fn().mockReturnThis(),
  fail:  jest.fn().mockReturnThis(),
}));

jest.mock('../src/core/retry', () => ({
  RetryManager: class {
    execute<T>(fn: () => Promise<T>): Promise<T> { return fn(); }
  },
}));

import { callOllamaSilent, sendToAIFast } from '../src/core/ai';

const originalEnv = { ...process.env };
const originalStdout = process.stdout.write.bind(process.stdout);

beforeEach(() => {
  jest.resetAllMocks();
  process.stdout.write = jest.fn() as any;
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = { ...originalEnv };
  process.stdout.write = originalStdout;
});

// ── callOllamaSilent ──────────────────────────────────────────────────────────

describe('callOllamaSilent', () => {
  it('retorna response do JSON sem streaming', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ response: 'resposta completa' }),
    });

    const result = await callOllamaSilent('meu prompt');
    expect(result).toBe('resposta completa');
  });

  it('envia stream: false no body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ response: 'ok' }),
    });

    await callOllamaSilent('prompt');

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.stream).toBe(false);
  });

  it('passa ollamaOpts como options no body', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ response: 'ok' }),
    });

    await callOllamaSilent('prompt', { temperature: 0.5, num_predict: 100 });

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.options).toEqual({ temperature: 0.5, num_predict: 100 });
  });

  it('usa AI_MODEL do env', async () => {
    process.env.AI_MODEL = 'mistral';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ response: 'ok' }),
    });

    await callOllamaSilent('prompt');

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(opts.body).model).toBe('mistral');
  });

  it('usa OLLAMA_HOST customizado', async () => {
    process.env.OLLAMA_HOST = 'http://10.0.0.5:11434';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ response: 'ok' }),
    });

    await callOllamaSilent('prompt');

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('10.0.0.5');
  });

  it('lança erro em resposta HTTP 500', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(callOllamaSilent('prompt')).rejects.toThrow('HTTP 500');
  });

  it('lança erro quando fetch falha (ex: timeout/rede)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));
    await expect(callOllamaSilent('prompt')).rejects.toThrow('network error');
  });

  it('retorna string vazia quando response está ausente no JSON', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    const result = await callOllamaSilent('prompt');
    expect(result).toBe('');
  });
});

// ── sendToAIFast ──────────────────────────────────────────────────────────────

describe('sendToAIFast', () => {
  function ollamaStream(chunks: Array<{ response?: string; done?: boolean }>): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
        }
        controller.close();
      },
    });
  }

  it('usa AUTO_MODEL quando definido', async () => {
    process.env.AUTO_MODEL = 'phi3';
    const stream = ollamaStream([{ response: 'ok', done: true }]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, body: stream });

    await sendToAIFast('prompt');

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(opts.body).model).toBe('phi3');
  });

  it('usa llama3.2:1b como padrão quando AUTO_MODEL não definido', async () => {
    delete process.env.AUTO_MODEL;
    const stream = ollamaStream([{ response: 'ok', done: true }]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, body: stream });

    await sendToAIFast('prompt');

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(opts.body).model).toBe('llama3.2:1b');
  });

  it('restaura AI_MODEL original após execução', async () => {
    process.env.AI_MODEL = 'llama3.2';
    const stream = ollamaStream([{ response: 'ok', done: true }]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, body: stream });

    await sendToAIFast('prompt');

    expect(process.env.AI_MODEL).toBe('llama3.2');
  });

  it('restaura AI_MODEL mesmo quando callOllama lança erro', async () => {
    process.env.AI_MODEL = 'llama3.2';
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

    await expect(sendToAIFast('prompt')).rejects.toThrow('network error');
    expect(process.env.AI_MODEL).toBe('llama3.2');
  });

  it('passa numPredict como num_predict nas options', async () => {
    const stream = ollamaStream([{ response: 'ok', done: true }]);
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, body: stream });

    await sendToAIFast('prompt', 150);

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(opts.body).options.num_predict).toBe(150);
  });
});
