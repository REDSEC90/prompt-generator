"use strict";
/**
 * Testes avançados para src/core/ai.ts
 *
 * Estratégia: mock global de fetch + ReadableStream para simular SSE
 * sem dependência de rede real.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Mock de ora antes de qualquer import
jest.mock('ora', () => () => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis(),
}));
// Mock de RetryManager para eliminar delays nos testes
jest.mock('../src/core/retry', () => ({
    RetryManager: class {
        execute(fn) { return fn(); }
    },
}));
const ai_1 = require("../src/core/ai");
// ── helpers ──────────────────────────────────────────────────────────────────
/** Cria um ReadableStream que emite eventos SSE a partir de chunks de texto. */
function sseStream(chunks) {
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
function anthropicEvent(text) {
    return `data: ${JSON.stringify({ type: 'content_block_delta', delta: { text } })}\n\n`;
}
function openaiEvent(content) {
    return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}
function mockFetch(body, status = 200) {
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
    process.stdout.write = jest.fn();
});
afterEach(() => {
    process.env = { ...originalEnv };
    process.stdout.write = originalStdout;
});
// ── modo offline ──────────────────────────────────────────────────────────────
describe('sendToAI — modo offline', () => {
    it('retorna string vazia quando AI_API_KEY não está definida', async () => {
        delete process.env.AI_API_KEY;
        const result = await (0, ai_1.sendToAI)('teste');
        expect(result).toBe('');
    });
});
// ── Anthropic ─────────────────────────────────────────────────────────────────
describe('sendToAI — Anthropic', () => {
    beforeEach(() => {
        process.env.AI_API_KEY = 'test-key';
        process.env.AI_PROVIDER = 'anthropic';
    });
    it('retorna texto concatenado dos eventos SSE', async () => {
        const stream = sseStream([
            anthropicEvent('Olá'),
            anthropicEvent(', mundo'),
            'data: [DONE]\n\n',
        ]);
        global.fetch = mockFetch(stream);
        const result = await (0, ai_1.sendToAI)('prompt');
        expect(result).toBe('Olá, mundo');
    });
    it('chama fetch com headers corretos', async () => {
        const stream = sseStream(['data: [DONE]\n\n']);
        global.fetch = mockFetch(stream);
        await (0, ai_1.sendToAI)('meu prompt');
        const [url, opts] = global.fetch.mock.calls[0];
        expect(url).toBe('https://api.anthropic.com/v1/messages');
        expect(opts.headers['x-api-key']).toBe('test-key');
        expect(opts.headers['anthropic-version']).toBe('2023-06-01');
    });
    it('inclui o prompt no body da requisição', async () => {
        const stream = sseStream(['data: [DONE]\n\n']);
        global.fetch = mockFetch(stream);
        await (0, ai_1.sendToAI)('meu prompt especial');
        const [, opts] = global.fetch.mock.calls[0];
        const body = JSON.parse(opts.body);
        expect(body.messages[0].content).toBe('meu prompt especial');
        expect(body.stream).toBe(true);
    });
    it('lança erro em resposta HTTP 500', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
        await expect((0, ai_1.sendToAI)('prompt')).rejects.toThrow('HTTP 500');
    });
    it('lança imediatamente em erro 400 sem retentar', async () => {
        global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400 });
        await expect((0, ai_1.sendToAI)('prompt')).rejects.toThrow('HTTP 400');
        expect(global.fetch.mock.calls.length).toBe(1);
    });
    it('ignora eventos SSE sem payload textual', async () => {
        const stream = sseStream([
            'data: {}\n\n',
            anthropicEvent('válido'),
            'data: [DONE]\n\n',
        ]);
        global.fetch = mockFetch(stream);
        const result = await (0, ai_1.sendToAI)('prompt');
        expect(result).toBe('válido');
    });
    it('usa AI_MODEL do env quando definido', async () => {
        process.env.AI_MODEL = 'claude-3-haiku';
        const stream = sseStream(['data: [DONE]\n\n']);
        global.fetch = mockFetch(stream);
        await (0, ai_1.sendToAI)('prompt');
        const [, opts] = global.fetch.mock.calls[0];
        expect(JSON.parse(opts.body).model).toBe('claude-3-haiku');
        delete process.env.AI_MODEL;
    });
});
// ── OpenAI ────────────────────────────────────────────────────────────────────
describe('sendToAI — OpenAI', () => {
    beforeEach(() => {
        process.env.AI_API_KEY = 'openai-key';
        process.env.AI_PROVIDER = 'openai';
    });
    it('retorna texto concatenado dos eventos SSE', async () => {
        const stream = sseStream([
            openaiEvent('Hello'),
            openaiEvent(' world'),
            'data: [DONE]\n\n',
        ]);
        global.fetch = mockFetch(stream);
        const result = await (0, ai_1.sendToAI)('prompt');
        expect(result).toBe('Hello world');
    });
    it('chama fetch com Authorization header correto', async () => {
        const stream = sseStream(['data: [DONE]\n\n']);
        global.fetch = mockFetch(stream);
        await (0, ai_1.sendToAI)('prompt');
        const [url, opts] = global.fetch.mock.calls[0];
        expect(url).toBe('https://api.openai.com/v1/chat/completions');
        expect(opts.headers['Authorization']).toBe('Bearer openai-key');
    });
    it('lança erro para provider desconhecido', async () => {
        process.env.AI_PROVIDER = 'gemini';
        await expect((0, ai_1.sendToAI)('prompt')).rejects.toThrow('Provider desconhecido');
    });
});
