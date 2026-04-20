import { TemplateEngine } from '../src/core/engine';
import { VariationGenerator } from '../src/core/variations';
import { RetryManager } from '../src/core/retry';
import { formatLabel, toneLabel } from '../src/core/templates';
import { PromptConfig } from '../src/core/types';

/** Config completa e válida reutilizada nos testes. */
const BASE: PromptConfig = {
  action:    'Analise',
  theme:     'React vs Vue',
  format:    'table',
  audience:  'dev sênior',
  objective: 'escolha de framework',
  tone:      'technical',
  category:  'analysis',
};

// ─── formatLabel ─────────────────────────────────────────────────────────────

describe('formatLabel', () => {
  it('retorna rótulo legível para todos os formatos', () => {
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
  it('retorna rótulo legível para todos os tons', () => {
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

  it('retorna valid:true para config completa e compatível', () => {
    const r = engine.validate(BASE);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.warnings).toHaveLength(0);
  });

  it('retorna erro para campo obrigatório ausente', () => {
    const r = engine.validate({ ...BASE, action: '' });
    expect(r.valid).toBe(false);
    expect(r.errors.some(e => e.includes('action'))).toBe(true);
  });

  it('retorna erro para múltiplos campos ausentes', () => {
    const r = engine.validate({ ...BASE, action: '', theme: '' });
    expect(r.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('retorna aviso (não erro) para json + marketing', () => {
    const r = engine.validate({ ...BASE, category: 'marketing', format: 'json' });
    expect(r.valid).toBe(true);  // sem erros bloqueantes
    expect(r.warnings.some(w => w.includes('json'))).toBe(true);
  });

  it('retorna aviso para code + summary', () => {
    const r = engine.validate({ ...BASE, category: 'summary', format: 'code' });
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('retorna aviso para table + marketing', () => {
    const r = engine.validate({ ...BASE, category: 'marketing', format: 'table' });
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

// ─── TemplateEngine.fill ─────────────────────────────────────────────────────

describe('TemplateEngine.fill', () => {
  const engine = new TemplateEngine();

  it('inclui theme, action, formato e tom', () => {
    const p = engine.fill(BASE);
    expect(p).toContain('React vs Vue');
    expect(p).toContain('Analise');
    expect(p).toContain('tabela Markdown');
    expect(p).toContain('técnico e preciso');
  });

  it('omite campos opcionais ausentes', () => {
    const p = engine.fill({ ...BASE, limit: undefined, restrictions: [], fewShot: undefined });
    expect(p).not.toMatch(/Limite:/);
    expect(p).not.toMatch(/Evitar:/);
    expect(p).not.toMatch(/Exemplo/);
  });

  it('inclui limit quando fornecido', () => {
    expect(engine.fill({ ...BASE, limit: '300 palavras' })).toContain('300 palavras');
  });

  it('inclui restrictions quando fornecidas', () => {
    expect(engine.fill({ ...BASE, restrictions: ['sem jargão'] })).toContain('sem jargão');
  });

  it('inclui few-shot quando fornecido', () => {
    const p = engine.fill({ ...BASE, fewShot: { input: 'React', output: '| React | Alta |' } });
    expect(p).toContain('| React | Alta |');
  });

  it('inclui instrução CoT quando chainOfThought:true', () => {
    expect(engine.fill({ ...BASE, chainOfThought: true })).toMatch(/critérios|raciocínio|justifique/i);
  });

  it('não inclui instrução CoT quando chainOfThought:false', () => {
    expect(engine.fill({ ...BASE, chainOfThought: false })).not.toMatch(/justifique a inclusão/i);
  });

  it('lança erro para config inválida (campo vazio)', () => {
    expect(() => engine.fill({ ...BASE, action: '' })).toThrow('PromptConfig inválido');
  });

  it('lança erro para categoria desconhecida', () => {
    // Bypass da validação para testar o guard interno
    expect(() => (engine as any).engine?.fill?.({ ...BASE, category: 'unknown' })).not.toThrow();
    // Teste direto via cast
    const spy = jest.spyOn(engine, 'validate').mockReturnValue({ valid: true, errors: [], warnings: [] });
    expect(() => engine.fill({ ...BASE, category: 'unknown' as any })).toThrow('Categoria desconhecida');
    spy.mockRestore();
  });

  it('gera prompt para todas as 5 categorias sem lançar erro', () => {
    const categories = ['summary', 'code', 'analysis', 'marketing', 'brainstorming'] as const;
    for (const category of categories) {
      expect(() => engine.fill({ ...BASE, category })).not.toThrow();
    }
  });

  it('template code usa language quando fornecido', () => {
    const p = engine.fill({ ...BASE, category: 'code', format: 'code', language: 'Python' });
    expect(p).toContain('Python');
  });
});

// ─── VariationGenerator.generate ─────────────────────────────────────────────

describe('VariationGenerator.generate', () => {
  const gen = new VariationGenerator();

  it('retorna as três variações como strings não-vazias', () => {
    const r = gen.generate(BASE);
    expect(r.direct.length).toBeGreaterThan(0);
    expect(r.contextual.length).toBeGreaterThan(0);
    expect(r.chainOfThought.length).toBeGreaterThan(0);
  });

  it('variação direct é mais curta que contextual', () => {
    const r = gen.generate({ ...BASE, audience: 'dev sênior', objective: 'escolha de stack' });
    expect(r.direct.length).toBeLessThan(r.contextual.length);
  });

  it('variação direct não contém audience nem objective originais', () => {
    const r = gen.generate({ ...BASE, audience: 'gestor de produto', objective: 'decisão de compra' });
    expect(r.direct).not.toContain('gestor de produto');
    expect(r.direct).not.toContain('decisão de compra');
  });

  it('variação chainOfThought contém instrução de raciocínio', () => {
    expect(gen.generate(BASE).chainOfThought).toMatch(/critérios|raciocínio|justifique/i);
  });

  it('variação contextual não contém instrução CoT', () => {
    expect(gen.generate(BASE).contextual).not.toMatch(/justifique a inclusão/i);
  });

  it('todas as variações contêm o theme', () => {
    const r = gen.generate(BASE);
    expect(r.direct).toContain('React vs Vue');
    expect(r.contextual).toContain('React vs Vue');
    expect(r.chainOfThought).toContain('React vs Vue');
  });
});

// ─── RetryManager ────────────────────────────────────────────────────────────

describe('RetryManager', () => {
  it('retorna o resultado na primeira tentativa bem-sucedida', async () => {
    const rm = new RetryManager(3, 0);
    const result = await rm.execute(async () => 42);
    expect(result).toBe(42);
  });

  it('retenta e retorna após falha transitória', async () => {
    const rm = new RetryManager(3, 0);
    let calls = 0;
    const result = await rm.execute(async () => {
      calls++;
      if (calls < 3) throw Object.assign(new Error('timeout'), { status: 503 });
      return 'ok';
    });
    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  it('lança imediatamente em erro 400 (não retenta)', async () => {
    const rm = new RetryManager(3, 0);
    let calls = 0;
    await expect(
      rm.execute(async () => {
        calls++;
        throw Object.assign(new Error('bad request'), { status: 400 });
      })
    ).rejects.toThrow('bad request');
    expect(calls).toBe(1);
  });

  it('retenta em erro 429 (rate limit)', async () => {
    const rm = new RetryManager(2, 0);
    let calls = 0;
    await expect(
      rm.execute(async () => {
        calls++;
        throw Object.assign(new Error('rate limit'), { status: 429 });
      })
    ).rejects.toThrow('rate limit');
    expect(calls).toBe(3); // 1 inicial + 2 retries
  });

  it('lança após esgotar todas as tentativas', async () => {
    const rm = new RetryManager(2, 0);
    let calls = 0;
    await expect(
      rm.execute(async () => { calls++; throw new Error('network'); })
    ).rejects.toThrow('network');
    expect(calls).toBe(3);
  });
});
