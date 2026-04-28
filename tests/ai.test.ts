/**
 * Testes avançados para src/core/ai.ts
 *
 * Estratégia: mock global de fetch + ReadableStream para simular SSE
 * sem dependência de rede real.
 */

// Mock de ora antes de qualquer import
jest.mock('ora', () => () => ({
  start: jest.fn().mockReturnThis(),
  stop:  jest.fn().mockReturnThis(),
  fail:  jest.fn().mockReturnThis(),
}));

// Mock de RetryManager para eliminar delays nos testes
jest.mock('../src/core/retry', () => ({
  RetryManager: class {
    execute<T>(fn: () => Promise<T>): Promise<T> { return fn(); }
  },
}));

import { sendToAI, resolveAIStatus } from '../src/core/ai';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Cria um ReadableStream que emite eventos SSE a partir de chunks de texto. */
function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

function anthropicEvent(text: string): string {
  return `data: ${JSON.stringify({ type: 'content_block_delta', delta: { text } })}\n\n`;
}

function openaiEvent(content: string): string {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

function mockFetch(body: ReadableStream, status = 200): jest.Mock {
  return jest.fn().mockResolvedValue({
    ok: status < 400,
    status,
    body,
  });
}

// ── setup / teardown ─────────────────────────────────────────────────────────

const originalEnv = { ...process.env };
const originalStdout = process.stdout.write.bind(process.stdout);

beforeEach(() => {
  jest.resetAllMocks();
  process.stdout.write = jest.fn() as any;
});

afterEach(() => {
  process.env = { ...originalEnv };
  process.stdout.write = originalStdout;
});

// ── modo offline ──────────────────────────────────────────────────────────────

describe('sendToAI — modo offline', () => {
  it('retorna string vazia quando AI_MODE=offline', async () => {
    process.env.AI_MODE = 'offline';
    const result = await sendToAI('teste');
    expect(result).toBe('');
  });

  it('retorna string vazia quando AI_API_KEY não está definida (auto sem Ollama)', async () => {
    process.env.AI_MODE = 'auto';
    delete process.env.AI_API_KEY;
    // Ollama indisponível no ambiente de teste
    global.fetch = jest.fn().mockRejectedValue(new Error('connection refused'));
    const result = await sendToAI('teste');
    expect(result).toBe('');
  });
});

// ── resolveAIStatus ───────────────────────────────────────────────────────────

describe('resolveAIStatus', () => {
  it('retorna mode=offline quando AI_MODE=offline', async () => {
    process.env.AI_MODE = 'offline';
    const s = await resolveAIStatus();
    expect(s.mode).toBe('offline');
    expect(s.available).toBe(true);
  });

  it('retorna mode=remote quando AI_MODE=remote e API key presente', async () => {
    process.env.AI_MODE     = 'remote';
    process.env.AI_PROVIDER = 'anthropic';
    process.env.AI_API_KEY  = 'sk-test';
    const s = await resolveAIStatus();
    expect(s.mode).toBe('remote');
    expect(s.provider).toContain('anthropic');
    expect(s.available).toBe(true);
  });

  it('retorna available=false quando AI_MODE=remote sem API key', async () => {
    process.env.AI_MODE = 'remote';
    delete process.env.AI_API_KEY;
    const s = await resolveAIStatus();
    expect(s.available).toBe(false);
  });
});

// ── Anthropic ─────────────────────────────────────────────────────────────────

describe('sendToAI — Anthropic', () => {
  beforeEach(() => {
    process.env.AI_MODE     = 'remote';
    process.env.AI_API_KEY  = 'test-key';
    process.env.AI_PROVIDER = 'anthropic';
  });

  it('retorna texto concatenado dos eventos SSE', async () => {
    const stream = sseStream([
      anthropicEvent('Olá'),
      anthropicEvent(', mundo'),
      'data: [DONE]\n\n',
    ]);
    global.fetch = mockFetch(stream);

    const result = await sendToAI('prompt');
    expect(result).toBe('Olá, mundo');
  });

  it('chama fetch com headers corretos', async () => {
    const stream = sseStream(['data: [DONE]\n\n']);
    global.fetch = mockFetch(stream);

    await sendToAI('meu prompt');

    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect((opts.headers as Record<string, string>)['x-api-key']).toBe('test-key');
    expect((opts.headers as Record<string, string>)['anthropic-version']).toBe('2023-06-01');
  });

  it('inclui o prompt no body da requisição', async () => {
    const stream = sseStream(['data: [DONE]\n\n']);
    global.fetch = mockFetch(stream);

    await sendToAI('meu prompt especial');

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(opts.body);
    expect(body.messages[0].content).toBe('meu prompt especial');
    expect(body.stream).toBe(true);
  });

  it('lança erro em resposta HTTP 500', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(sendToAI('prompt')).rejects.toThrow('HTTP 500');
  });

  it('lança imediatamente em erro 400 sem retentar', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });
    await expect(sendToAI('prompt')).rejects.toThrow('HTTP 400');
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
  });

  it('ignora eventos SSE sem payload textual', async () => {
    const stream = sseStream([
      'data: {}\n\n',
      anthropicEvent('válido'),
      'data: [DONE]\n\n',
    ]);
    global.fetch = mockFetch(stream);

    const result = await sendToAI('prompt');
    expect(result).toBe('válido');
  });

  it('usa AI_MODEL do env quando definido', async () => {
    process.env.AI_MODEL = 'claude-3-haiku';
    const stream = sseStream(['data: [DONE]\n\n']);
    global.fetch = mockFetch(stream);

    await sendToAI('prompt');

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(opts.body).model).toBe('claude-3-haiku');
    delete process.env.AI_MODEL;
  });
});

// ── OpenAI ────────────────────────────────────────────────────────────────────

describe('sendToAI — OpenAI', () => {
  beforeEach(() => {
    process.env.AI_MODE     = 'remote';
    process.env.AI_API_KEY  = 'openai-key';
    process.env.AI_PROVIDER = 'openai';
  });

  it('retorna texto concatenado dos eventos SSE', async () => {
    const stream = sseStream([
      openaiEvent('Hello'),
      openaiEvent(' world'),
      'data: [DONE]\n\n',
    ]);
    global.fetch = mockFetch(stream);

    const result = await sendToAI('prompt');
    expect(result).toBe('Hello world');
  });

  it('chama fetch com Authorization header correto', async () => {
    const stream = sseStream(['data: [DONE]\n\n']);
    global.fetch = mockFetch(stream);

    await sendToAI('prompt');

    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer openai-key');
  });

  it('lança erro para provider desconhecido', async () => {
    process.env.AI_PROVIDER = 'gemini';
    await expect(sendToAI('prompt')).rejects.toThrow('Provider remoto desconhecido');
  });
});

// ── Ollama ────────────────────────────────────────────────────────────────────

describe('sendToAI — Ollama', () => {
  beforeEach(() => {
    process.env.AI_MODE     = 'local';
    process.env.AI_PROVIDER = 'ollama';
    delete process.env.AI_MODEL;
  });

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

  it('retorna texto concatenado dos chunks NDJSON', async () => {
    const stream = ollamaStream([
      { response: 'Olá' },
      { response: ', mundo', done: true },
    ]);
    global.fetch = mockFetch(stream);

    const result = await sendToAI('prompt');
    expect(result).toBe('Olá, mundo');
  });

  it('chama fetch com URL e body corretos', async () => {
    const stream = ollamaStream([{ response: 'ok', done: true }]);
    global.fetch = mockFetch(stream);

    await sendToAI('meu prompt');

    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/api/generate');
    const body = JSON.parse(opts.body);
    expect(body.prompt).toBe('meu prompt');
    expect(body.stream).toBe(true);
  });

  it('usa AI_MODEL do env quando definido', async () => {
    process.env.AI_MODEL = 'llama3.2';
    const stream = ollamaStream([{ response: 'ok', done: true }]);
    global.fetch = mockFetch(stream);

    await sendToAI('prompt');

    const [, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(JSON.parse(opts.body).model).toBe('llama3.2');
  });

  it('usa OLLAMA_HOST customizado', async () => {
    process.env.OLLAMA_HOST = 'http://192.168.1.10:11434';
    const stream = ollamaStream([{ response: 'ok', done: true }]);
    global.fetch = mockFetch(stream);

    await sendToAI('prompt');

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('192.168.1.10');
    delete process.env.OLLAMA_HOST;
  });

  it('lança erro em resposta HTTP 500', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(sendToAI('prompt')).rejects.toThrow('HTTP 500');
  });

  it('ignora linhas NDJSON sem campo response', async () => {
    const stream = ollamaStream([
      { done: false },
      { response: 'texto', done: true },
    ]);
    global.fetch = mockFetch(stream);

    const result = await sendToAI('prompt');
    expect(result).toBe('texto');
  });
});

// ── modo auto ─────────────────────────────────────────────────────────────────

describe('sendToAI — modo auto', () => {
  beforeEach(() => {
    process.env.AI_MODE = 'auto';
    delete process.env.AI_API_KEY;
  });

  it('cai para offline quando Ollama e API key indisponíveis', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('connection refused'));
    const result = await sendToAI('prompt');
    expect(result).toBe('');
  });

  it('usa remote quando Ollama indisponível mas API key presente', async () => {
    process.env.AI_API_KEY  = 'sk-test';
    process.env.AI_PROVIDER = 'anthropic';

    // primeira chamada: ollamaAvailable → rejeita
    // segunda chamada: callAnthropic → retorna SSE
    const encoder = new TextEncoder();
    const sseBody = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content_block_delta', delta: { text: 'ok' } })}\n\n`));
        c.enqueue(encoder.encode('data: [DONE]\n\n'));
        c.close();
      },
    });

    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('connection refused'))  // ollamaAvailable
      .mockResolvedValueOnce({ ok: true, status: 200, body: sseBody }); // anthropic

    const result = await sendToAI('prompt');
    expect(result).toBe('ok');
  });
});

// ── resolveAIStatus — modo local ──────────────────────────────────────────────

describe('resolveAIStatus — modo local', () => {
  it('retorna mode=local quando AI_MODE=local', async () => {
    process.env.AI_MODE = 'local';
    // ollamaAvailable não é chamado em modo local explícito
    const s = await resolveAIStatus();
    expect(s.mode).toBe('local');
    expect(s.provider).toContain('ollama');
  });
});
