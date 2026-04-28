import { TemplateEngine } from '../src/core/engine';
import { VariationGenerator } from '../src/core/variations';
import { RetryManager } from '../src/core/retry';
import { formatLabel, toneLabel } from '../src/core/templates';
import { PromptConfig } from '../src/core/types';
import { parseArgs } from '../src/cli/args';

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

  it('omite placeholders da variação direta quando audience/objective são "-"', () => {
    const p = engine.fill({ ...BASE, audience: '-', objective: '-' });
    expect(p).not.toContain('Público-alvo: -.');
    expect(p).not.toContain('Objetivo: -.');
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

  it('gera prompt para todas as 8 categorias sem lançar erro', () => {
    const categories = ['summary', 'code', 'analysis', 'marketing', 'brainstorming', 'translation', 'qa', 'creative'] as const;
    for (const category of categories) {
      expect(() => engine.fill({ ...BASE, category })).not.toThrow();
    }
  });

  it('template translation inclui idioma de destino', () => {
    const p = engine.fill({ ...BASE, category: 'translation', language: 'Inglês' });
    expect(p).toContain('Inglês');
  });

  it('template qa inclui critério de qualidade', () => {
    const p = engine.fill({ ...BASE, category: 'qa', objective: 'cobertura de edge cases' });
    expect(p).toContain('cobertura de edge cases');
  });

  it('template creative inclui intenção criativa', () => {
    const p = engine.fill({ ...BASE, category: 'creative', objective: 'provocar reflexão' });
    expect(p).toContain('provocar reflexão');
  });

  it('template code usa language quando fornecido', () => {
    const p = engine.fill({ ...BASE, category: 'code', format: 'code', language: 'Python' });
    expect(p).toContain('Python');
  });

  it('template marketing inclui formato de saída real', () => {
    const p = engine.fill({ ...BASE, category: 'marketing', format: 'html', limit: '2 blocos' });
    expect(p).toContain('Formato de saída: HTML semântico.');
    expect(p).toContain('Limite: 2 blocos.');
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
    expect(r.direct).not.toContain('Público: -.');
    expect(r.direct).not.toContain('Critérios: -.');
  });

  it('variação chainOfThought contém instrução de raciocínio', () => {
    expect(gen.generate(BASE).chainOfThought).toMatch(/critérios|raciocínio|justifique/i);
  });

  it('variação chainOfThought de category:code NÃO contém instrução CoT', () => {
    const codeConfig: PromptConfig = { ...BASE, category: 'code', format: 'code', language: 'TypeScript' };
    expect(gen.generate(codeConfig).chainOfThought).not.toMatch(/justifique|raciocínio|critérios/i);
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

// ─── parseArgs ───────────────────────────────────────────────────────────────

describe('parseArgs', () => {
  it('reconhece flags parciais como entrada CLI sem marcar config completa', () => {
    const parsed = parseArgs(['node', 'cli', '--theme', 'JWT']);
    expect(parsed.hasCliInput).toBe(true);
    expect(parsed.isComplete).toBe(false);
    expect(parsed.config.theme).toBe('JWT');
  });

  it('marca config completa quando todos os obrigatórios são informados', () => {
    const parsed = parseArgs([
      'node', 'cli',
      '--theme', 'JWT',
      '--action', 'escreva',
      '--category', 'code',
      '--audience', 'backend',
      '--objective', 'validar token',
      '--tone', 'technical',
      '--format', 'code',
    ]);
    expect(parsed.isComplete).toBe(true);
  });

  it('respeita a flag --interactive', () => {
    const parsed = parseArgs(['node', 'cli', '--interactive', '--theme', 'JWT']);
    expect(parsed.forceInteractive).toBe(true);
  });

  it('--no-send define noSend=true', () => {
    const parsed = parseArgs(['node', 'cli', '--no-send', '--theme', 'JWT']);
    expect(parsed.noSend).toBe(true);
  });

  it('--export define autoExport=true', () => {
    const parsed = parseArgs(['node', 'cli', '--export']);
    expect(parsed.autoExport).toBe(true);
  });

  it('--few-shot-input e --few-shot-output montam fewShot', () => {
    const parsed = parseArgs(['node', 'cli',
      '--few-shot-input', 'entrada', '--few-shot-output', 'saída']);
    expect(parsed.config.fewShot).toEqual({ input: 'entrada', output: 'saída' });
  });

  it('--ai-generate captura o objetivo', () => {
    const parsed = parseArgs(['node', 'cli', '--ai-generate', 'criar endpoint JWT']);
    expect(parsed.aiGenerate).toBe('criar endpoint JWT');
  });

  it('--restrictions converte para array', () => {
    const parsed = parseArgs(['node', 'cli', '--restrictions', 'sem jargão,sem libs']);
    expect(parsed.config.restrictions).toEqual(['sem jargão', 'sem libs']);
  });

  it('--category inválida chama process.exit(1)', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => parseArgs(['node', 'cli', '--category', 'invalida'])).toThrow('exit');
    exit.mockRestore();
  });

  it('--tone inválido chama process.exit(1)', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => parseArgs(['node', 'cli', '--tone', 'invalido'])).toThrow('exit');
    exit.mockRestore();
  });

  it('--format inválido chama process.exit(1)', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() => parseArgs(['node', 'cli', '--format', 'invalido'])).toThrow('exit');
    exit.mockRestore();
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

// ─── collectRequired / collectOptional ───────────────────────────────────────

jest.mock('@inquirer/prompts', () => ({
  input:   jest.fn(),
  select:  jest.fn(),
  confirm: jest.fn(),
}));

import { input, select, confirm } from '@inquirer/prompts';
import { collectRequired, collectOptional } from '../src/cli/fields';

const mockInput   = input   as jest.MockedFunction<typeof input>;
const mockSelect  = select  as jest.MockedFunction<typeof select>;
const mockConfirm = confirm as jest.MockedFunction<typeof confirm>;

describe('collectRequired', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna os 7 campos obrigatórios com os valores fornecidos', async () => {
    mockInput
      .mockResolvedValueOnce('React vs Vue')   // theme
      .mockResolvedValueOnce('compare');        // action
    mockSelect
      .mockResolvedValueOnce('analysis')        // category
      .mockResolvedValueOnce('technical')       // tone
      .mockResolvedValueOnce('table');          // format
    mockInput
      .mockResolvedValueOnce('dev sênior')      // audience
      .mockResolvedValueOnce('escolha de stack'); // objective

    const result = await collectRequired({});
    expect(result.theme).toBe('React vs Vue');
    expect(result.action).toBe('compare');
    expect(result.category).toBe('analysis');
    expect(result.tone).toBe('technical');
    expect(result.format).toBe('table');
    expect(result.audience).toBe('dev sênior');
    expect(result.objective).toBe('escolha de stack');
  });

  it('usa valores de initial como default', async () => {
    mockInput.mockResolvedValue('');
    mockSelect.mockResolvedValue('summary');

    await collectRequired({ theme: 'JWT', category: 'code' });

    // Verifica que o default foi passado para o primeiro input (theme)
    expect(mockInput).toHaveBeenCalledWith(expect.objectContaining({ default: 'JWT' }));
  });
});

describe('collectOptional', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna language e limit quando preenchidos', async () => {
    mockInput
      .mockResolvedValueOnce('TypeScript')  // language
      .mockResolvedValueOnce('300 linhas'); // limit
    mockInput.mockResolvedValueOnce('');    // restrictions
    mockConfirm.mockResolvedValueOnce(false); // sem few-shot

    const result = await collectOptional({}, 'code');
    expect(result.language).toBe('TypeScript');
    expect(result.limit).toBe('300 linhas');
    expect(result.fewShot).toBeUndefined();
  });

  it('retorna fewShot quando confirmado', async () => {
    mockInput.mockResolvedValueOnce('').mockResolvedValueOnce(''); // language, limit
    mockInput.mockResolvedValueOnce('');                           // restrictions
    mockConfirm.mockResolvedValueOnce(true);                       // quer few-shot
    mockInput
      .mockResolvedValueOnce('entrada de exemplo')
      .mockResolvedValueOnce('saída de exemplo');

    const result = await collectOptional({}, 'analysis');
    expect(result.fewShot).toEqual({ input: 'entrada de exemplo', output: 'saída de exemplo' });
  });

  it('retorna restrictions como array', async () => {
    mockInput.mockResolvedValueOnce('').mockResolvedValueOnce(''); // language, limit
    mockInput.mockResolvedValueOnce('sem jargão, sem libs externas');
    mockConfirm.mockResolvedValueOnce(false);

    const result = await collectOptional({}, 'summary');
    expect(result.restrictions).toEqual(['sem jargão', 'sem libs externas']);
  });

  it('adapta mensagem de language para category:translation', async () => {
    mockInput.mockResolvedValue('');
    mockConfirm.mockResolvedValueOnce(false);

    await collectOptional({}, 'translation');

    const firstCall = mockInput.mock.calls[0][0] as { message: string };
    expect(firstCall.message).toMatch(/idioma de destino/i);
  });
});
