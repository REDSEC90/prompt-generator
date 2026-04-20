import { TemplateEngine } from '../src/core/engine';
import { VariationGenerator } from '../src/core/variations';
import { formatLabel, toneLabel } from '../src/core/templates';
import { PromptConfig } from '../src/core/types';

/** Config mínima válida reutilizada nos testes. */
const BASE: PromptConfig = {
  action: 'Analise',
  theme: 'React vs Vue',
  format: 'table',
  audience: 'dev sênior',
  objective: 'escolha de framework',
  tone: 'technical',
  category: 'analysis',
};

// ─── formatLabel ────────────────────────────────────────────────────────────

describe('formatLabel', () => {
  it('retorna rótulo legível para cada formato suportado', () => {
    expect(formatLabel('markdown')).toBe('Markdown com seções H2 e bullet points');
    expect(formatLabel('json')).toBe('JSON válido');
    expect(formatLabel('table')).toBe('tabela Markdown');
    expect(formatLabel('numbered-list')).toBe('lista numerada');
    expect(formatLabel('prose')).toBe('texto corrido em parágrafos');
    expect(formatLabel('html')).toBe('HTML semântico');
    expect(formatLabel('code')).toBe('bloco de código com comentários');
  });
});

// ─── toneLabel ───────────────────────────────────────────────────────────────

describe('toneLabel', () => {
  it('retorna rótulo legível para cada tom suportado', () => {
    expect(toneLabel('formal')).toBe('formal e objetivo');
    expect(toneLabel('friendly')).toBe('amigável e acessível');
    expect(toneLabel('persuasive')).toBe('persuasivo, com senso de urgência');
    expect(toneLabel('didactic')).toBe('didático e progressivo');
    expect(toneLabel('journalistic')).toBe('jornalístico, direto');
    expect(toneLabel('technical')).toBe('técnico e preciso');
  });

  it('retorna o valor original para tom desconhecido', () => {
    expect(toneLabel('unknown')).toBe('unknown');
  });
});

// ─── TemplateEngine.validate ─────────────────────────────────────────────────

describe('TemplateEngine.validate', () => {
  const engine = new TemplateEngine();

  it('retorna valid:true para combinação compatível', () => {
    const result = engine.validate(BASE); // analysis + table → compatível
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('retorna valid:false para json + marketing', () => {
    const result = engine.validate({ ...BASE, category: 'marketing', format: 'json' });
    expect(result.valid).toBe(false);
    expect(result.warnings[0]).toMatch(/json/);
  });

  it('retorna valid:false para code + summary', () => {
    const result = engine.validate({ ...BASE, category: 'summary', format: 'code' });
    expect(result.valid).toBe(false);
  });

  it('retorna valid:false para table + marketing', () => {
    const result = engine.validate({ ...BASE, category: 'marketing', format: 'table' });
    expect(result.valid).toBe(false);
  });
});

// ─── TemplateEngine.fill ─────────────────────────────────────────────────────

describe('TemplateEngine.fill', () => {
  const engine = new TemplateEngine();

  it('inclui theme e action no prompt gerado', () => {
    const prompt = engine.fill(BASE);
    expect(prompt).toContain('React vs Vue');
    expect(prompt).toContain('Analise');
  });

  it('inclui formato e tom', () => {
    const prompt = engine.fill(BASE);
    expect(prompt).toContain('tabela Markdown');
    expect(prompt).toContain('técnico e preciso');
  });

  it('omite campos opcionais ausentes (sem linhas vazias)', () => {
    const config: PromptConfig = { ...BASE, limit: undefined, restrictions: [], fewShot: undefined };
    const prompt = engine.fill(config);
    expect(prompt).not.toMatch(/Limite:/);
    expect(prompt).not.toMatch(/Evitar:/);
    expect(prompt).not.toMatch(/Exemplo/);
  });

  it('inclui limit quando fornecido', () => {
    const prompt = engine.fill({ ...BASE, limit: '300 palavras' });
    expect(prompt).toContain('300 palavras');
  });

  it('inclui restrictions quando fornecidas', () => {
    const prompt = engine.fill({ ...BASE, restrictions: ['sem jargão', 'sem tabelas aninhadas'] });
    expect(prompt).toContain('sem jargão');
  });

  it('inclui few-shot quando fornecido', () => {
    const prompt = engine.fill({ ...BASE, fewShot: { input: 'React', output: '| React | Alta |' } });
    expect(prompt).toContain('| React | Alta |');
  });

  it('inclui instrução CoT quando chainOfThought:true', () => {
    const prompt = engine.fill({ ...BASE, chainOfThought: true });
    expect(prompt).toMatch(/critérios|raciocínio|justifique/i);
  });

  it('não inclui instrução CoT quando chainOfThought:false', () => {
    const prompt = engine.fill({ ...BASE, chainOfThought: false });
    expect(prompt).not.toMatch(/justifique a inclusão/i);
  });

  it('lança erro para categoria desconhecida', () => {
    expect(() => engine.fill({ ...BASE, category: 'unknown' as any })).toThrow('Categoria desconhecida');
  });

  it('gera prompt para todas as 5 categorias sem lançar erro', () => {
    const categories = ['summary', 'code', 'analysis', 'marketing', 'brainstorming'] as const;
    for (const category of categories) {
      expect(() => engine.fill({ ...BASE, category })).not.toThrow();
    }
  });
});

// ─── VariationGenerator.generate ─────────────────────────────────────────────

describe('VariationGenerator.generate', () => {
  const gen = new VariationGenerator();

  it('retorna as três variações como strings não-vazias', () => {
    const result = gen.generate(BASE);
    expect(typeof result.direct).toBe('string');
    expect(typeof result.contextual).toBe('string');
    expect(typeof result.chainOfThought).toBe('string');
    expect(result.direct.length).toBeGreaterThan(0);
    expect(result.contextual.length).toBeGreaterThan(0);
    expect(result.chainOfThought.length).toBeGreaterThan(0);
  });

  it('variação direct é mais curta que contextual', () => {
    const result = gen.generate({ ...BASE, audience: 'dev sênior', objective: 'escolha de stack' });
    expect(result.direct.length).toBeLessThan(result.contextual.length);
  });

  it('variação direct não contém audience nem objective', () => {
    const result = gen.generate({ ...BASE, audience: 'gestor de produto', objective: 'decisão de compra' });
    expect(result.direct).not.toContain('gestor de produto');
    expect(result.direct).not.toContain('decisão de compra');
  });

  it('variação chainOfThought contém instrução de raciocínio', () => {
    const result = gen.generate(BASE);
    expect(result.chainOfThought).toMatch(/critérios|raciocínio|justifique/i);
  });

  it('variação contextual não contém instrução CoT', () => {
    const result = gen.generate(BASE);
    expect(result.contextual).not.toMatch(/justifique a inclusão/i);
  });

  it('as três variações contêm o theme', () => {
    const result = gen.generate(BASE);
    expect(result.direct).toContain('React vs Vue');
    expect(result.contextual).toContain('React vs Vue');
    expect(result.chainOfThought).toContain('React vs Vue');
  });
});
