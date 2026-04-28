jest.mock('../src/core/ai', () => ({ sendToAI: jest.fn() }));

import { judgePrompt, generateAndJudge } from '../src/core/judge';
import { sendToAI } from '../src/core/ai';

const mockSend = sendToAI as jest.Mock;

beforeEach(() => jest.resetAllMocks());

describe('judgePrompt', () => {
  it('parseia JSON limpo e retorna rating + reason', async () => {
    mockSend.mockResolvedValue('{"score":4,"reason":"too_vague","critique":"faltou contexto"}');
    const r = await judgePrompt('meu prompt');
    expect(r.rating).toBe(4);
    expect(r.failureReason).toBe('too_vague');
    expect(r.critique).toBe('faltou contexto');
  });

  it('extrai JSON de dentro de markdown', async () => {
    mockSend.mockResolvedValue('```json\n{"score":5,"reason":"none","critique":"excelente"}\n```');
    const r = await judgePrompt('prompt');
    expect(r.rating).toBe(5);
    expect(r.failureReason).toBeUndefined();
  });

  it('retorna rating 3 neutro quando parse falha', async () => {
    mockSend.mockResolvedValue('resposta inválida sem json');
    const r = await judgePrompt('prompt');
    expect(r.rating).toBe(3);
  });

  it('retorna rating 3 quando sendToAI lança erro', async () => {
    mockSend.mockRejectedValue(new Error('offline'));
    const r = await judgePrompt('prompt');
    expect(r.rating).toBe(3);
  });

  it('clipa score fora do range 1-5', async () => {
    mockSend.mockResolvedValue('{"score":10,"reason":"none","critique":"ok"}');
    const r = await judgePrompt('prompt');
    expect(r.rating).toBe(5);
  });

  it('reason=none resulta em failureReason undefined', async () => {
    mockSend.mockResolvedValue('{"score":4,"reason":"none","critique":"bom"}');
    const r = await judgePrompt('prompt');
    expect(r.failureReason).toBeUndefined();
  });
});

describe('generateAndJudge', () => {
  it('extrai prompt gerado e avaliação da resposta combinada', async () => {
    mockSend.mockResolvedValue(
      'Você é um engenheiro sênior. Crie um endpoint REST.\n{"score":4,"reason":"none","critique":"bom prompt"}'
    );
    const r = await generateAndJudge('criar API REST');
    expect(r.rating).toBe(4);
    expect(r.generatedPrompt).toContain('engenheiro sênior');
    expect(r.failureReason).toBeUndefined();
  });

  it('retorna rating 3 em caso de erro', async () => {
    mockSend.mockRejectedValue(new Error('timeout'));
    const r = await generateAndJudge('objetivo');
    expect(r.rating).toBe(3);
  });

  it('passa previous e previousReason no prompt de reescrita', async () => {
    mockSend.mockResolvedValue('{"score":5,"reason":"none","critique":"ok"}');
    await generateAndJudge('objetivo', 'prompt anterior', 'too_vague');
    const callArg = mockSend.mock.calls[0][0] as string;
    expect(callArg).toContain('too_vague');
    expect(callArg).toContain('prompt anterior');
  });
});
