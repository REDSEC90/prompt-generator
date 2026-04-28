"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generator_1 = require("../src/core/generator");
jest.mock('../src/core/ai', () => ({
    sendToAI: jest.fn().mockResolvedValue('prompt gerado pela IA'),
}));
const ai_1 = require("../src/core/ai");
const mockSendToAI = ai_1.sendToAI;
const FB = {
    config: {
        action: 'Escreva', theme: 'JWT', format: 'code',
        audience: 'dev', objective: 'autenticar', tone: 'technical', category: 'code',
    },
    generatedPrompt: 'prompt exemplo bem avaliado',
    rating: 5,
    usedVariation: 'direct',
    timestamp: 1000,
};
describe('generatePrompt', () => {
    beforeEach(() => mockSendToAI.mockClear());
    it('chama sendToAI e retorna o resultado', async () => {
        const result = await (0, generator_1.generatePrompt)('criar endpoint REST');
        expect(result).toBe('prompt gerado pela IA');
        expect(mockSendToAI).toHaveBeenCalledTimes(1);
    });
    it('inclui few-shot de exemplos com rating >= 4 no prompt enviado', async () => {
        await (0, generator_1.generatePrompt)('criar endpoint REST', [FB]);
        const [calledPrompt] = mockSendToAI.mock.calls[0];
        expect(calledPrompt).toContain('prompt exemplo bem avaliado');
    });
    it('não inclui exemplos com rating < 4', async () => {
        await (0, generator_1.generatePrompt)('criar endpoint REST', [{ ...FB, rating: 3 }]);
        const [calledPrompt] = mockSendToAI.mock.calls[0];
        expect(calledPrompt).not.toContain('prompt exemplo bem avaliado');
    });
    it('usa no máximo 3 exemplos few-shot', async () => {
        const history = Array.from({ length: 5 }, (_, i) => ({
            ...FB, generatedPrompt: `exemplo-${i}`, timestamp: i,
        }));
        await (0, generator_1.generatePrompt)('objetivo', history);
        const [calledPrompt] = mockSendToAI.mock.calls[0];
        const matches = (calledPrompt.match(/exemplo-/g) ?? []).length;
        expect(matches).toBeLessThanOrEqual(3);
    });
});
describe('rewritePrompt', () => {
    beforeEach(() => mockSendToAI.mockClear());
    it('chama sendToAI com o prompt original e o motivo da falha', async () => {
        await (0, generator_1.rewritePrompt)('prompt original', 'too_vague');
        const [calledPrompt] = mockSendToAI.mock.calls[0];
        expect(calledPrompt).toContain('prompt original');
        expect(calledPrompt).toContain('too_vague');
    });
    it('retorna o resultado de sendToAI', async () => {
        const result = await (0, generator_1.rewritePrompt)('prompt original', 'wrong_format');
        expect(result).toBe('prompt gerado pela IA');
    });
    it('inclui dica específica para cada FailureReason', async () => {
        await (0, generator_1.rewritePrompt)('p', 'hallucinated');
        const [calledPrompt] = mockSendToAI.mock.calls[0];
        expect(calledPrompt).toMatch(/não souber|explicitamente/i);
    });
});
