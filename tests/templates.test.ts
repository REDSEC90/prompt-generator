/**
 * Testes para todos os templates — src/core/templates.ts
 * Garante que cada categoria gera output com os campos do config.
 */

import TEMPLATES from '../src/core/templates';
import { PromptConfig } from '../src/core/types';

const base: PromptConfig = {
  theme: 'tema teste',
  action: 'escreva',
  category: 'code',
  audience: 'desenvolvedor',
  objective: 'objetivo teste',
  tone: 'technical',
  format: 'markdown',
};

const categories = ['summary', 'code', 'analysis', 'marketing', 'brainstorming', 'translation', 'qa', 'creative'] as const;

describe('Templates — geração básica por categoria', () => {
  for (const category of categories) {
    it(`${category}: gera string não-vazia com tema e objetivo`, () => {
      const config: PromptConfig = { ...base, category };
      const result = TEMPLATES[category](config);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(50);
      expect(result).toContain('tema teste');
      expect(result).toContain('objetivo teste');
    });
  }
});

describe('Templates — campos opcionais', () => {
  it('code: inclui linguagem quando fornecida', () => {
    const config: PromptConfig = { ...base, category: 'code', language: 'TypeScript' };
    expect(TEMPLATES.code(config)).toContain('TypeScript');
  });

  it('code: não quebra sem linguagem', () => {
    const config: PromptConfig = { ...base, category: 'code', language: undefined };
    expect(() => TEMPLATES.code(config)).not.toThrow();
  });

  it('qualquer categoria: inclui limit quando fornecido', () => {
    const config: PromptConfig = { ...base, category: 'summary', limit: '200 palavras' };
    expect(TEMPLATES.summary(config)).toContain('200 palavras');
  });

  it('qualquer categoria: inclui restrictions quando fornecidas', () => {
    const config: PromptConfig = { ...base, category: 'analysis', restrictions: ['sem jargão', 'máx 3 parágrafos'] };
    const result = TEMPLATES.analysis(config);
    expect(result).toContain('sem jargão');
    expect(result).toContain('máx 3 parágrafos');
  });

  it('qualquer categoria: inclui fewShot quando fornecido', () => {
    const config: PromptConfig = {
      ...base, category: 'qa',
      fewShot: { input: 'pergunta exemplo', output: 'resposta exemplo' },
    };
    const result = TEMPLATES.qa(config);
    expect(result).toContain('pergunta exemplo');
    expect(result).toContain('resposta exemplo');
  });

  it('qualquer categoria: inclui instrução CoT quando chainOfThought=true', () => {
    const config: PromptConfig = { ...base, category: 'analysis', chainOfThought: true };
    const result = TEMPLATES.analysis(config);
    // CoT deve adicionar alguma instrução de raciocínio
    expect(result.length).toBeGreaterThan(TEMPLATES.analysis({ ...config, chainOfThought: false }).length);
  });
});

describe('Templates — translation', () => {
  it('inclui idioma de destino quando language é fornecido', () => {
    const config: PromptConfig = { ...base, category: 'translation', language: 'Português' };
    expect(TEMPLATES.translation(config)).toContain('Português');
  });
});

describe('Templates — marketing', () => {
  it('inclui tom persuasivo no output', () => {
    const config: PromptConfig = { ...base, category: 'marketing', tone: 'persuasive' };
    const result = TEMPLATES.marketing(config);
    expect(result).toContain('tema teste');
  });
});
