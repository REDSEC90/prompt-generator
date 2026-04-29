/**
 * Testes para parseArgs — src/cli/args.ts
 * Cobre flags CRUD, loop, auto e casos de borda não testados.
 */

import { parseArgs } from '../src/cli/args';

// parseArgs chama process.exit(1) em flags inválidas — precisamos mockar
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

afterAll(() => mockExit.mockRestore());

// helper
const parse = (flags: string[]) => parseArgs(['node', 'script', ...flags]);

describe('parseArgs — flags CRUD', () => {
  it('--save captura o nome', () => {
    const r = parse(['--save', 'meu-prompt', '--theme', 'x', '--action', 'y',
      '--category', 'code', '--audience', 'a', '--objective', 'o',
      '--tone', 'technical', '--format', 'code']);
    expect(r.save).toBe('meu-prompt');
  });

  it('--load captura o nome', () => {
    const r = parse(['--load', 'meu-prompt']);
    expect(r.load).toBe('meu-prompt');
  });

  it('--list é true quando presente', () => {
    const r = parse(['--list']);
    expect(r.list).toBe(true);
  });

  it('--delete captura o nome', () => {
    const r = parse(['--delete', 'antigo']);
    expect(r.deleteName).toBe('antigo');
  });
});

describe('parseArgs — flags de loop', () => {
  it('--loop captura o objetivo', () => {
    const r = parse(['--loop', 'criar API REST']);
    expect(r.loop).toBe('criar API REST');
  });

  it('--loop-max captura o número', () => {
    const r = parse(['--loop', 'x', '--loop-max', '10']);
    expect(r.loopMax).toBe(10);
  });

  it('--loop-target captura o número', () => {
    const r = parse(['--loop', 'x', '--loop-target', '5']);
    expect(r.loopTarget).toBe(5);
  });

  it('--auto é true quando presente', () => {
    const r = parse(['--auto']);
    expect(r.auto).toBe(true);
  });

  it('--auto-max captura o número', () => {
    const r = parse(['--auto', '--auto-max', '8']);
    expect(r.autoMax).toBe(8);
  });

  it('--auto-target captura o número', () => {
    const r = parse(['--auto', '--auto-target', '3']);
    expect(r.autoTarget).toBe(3);
  });
});

describe('parseArgs — flags opcionais', () => {
  it('--no-send é true quando presente', () => {
    const r = parse(['--no-send']);
    expect(r.noSend).toBe(true);
  });

  it('--export ativa autoExport', () => {
    const r = parse(['--export']);
    expect(r.autoExport).toBe(true);
  });

  it('--interactive ativa forceInteractive', () => {
    const r = parse(['--interactive']);
    expect(r.forceInteractive).toBe(true);
  });

  it('--restrictions é dividido por vírgula', () => {
    const r = parse(['--restrictions', 'sem markdown,máx 200 palavras']);
    expect(r.config.restrictions).toEqual(['sem markdown', 'máx 200 palavras']);
  });

  it('--few-shot-input e --few-shot-output formam fewShot', () => {
    const r = parse(['--few-shot-input', 'entrada', '--few-shot-output', 'saída']);
    expect(r.config.fewShot).toEqual({ input: 'entrada', output: 'saída' });
  });

  it('fewShot não é criado quando apenas input é fornecido', () => {
    const r = parse(['--few-shot-input', 'entrada']);
    expect(r.config.fewShot).toBeUndefined();
  });
});

describe('parseArgs — isComplete', () => {
  const allFlags = [
    '--theme', 'JWT', '--action', 'implemente',
    '--category', 'code', '--audience', 'dev',
    '--objective', 'middleware', '--tone', 'technical', '--format', 'code',
  ];

  it('isComplete=true quando todos os campos obrigatórios estão presentes', () => {
    const r = parse(allFlags);
    expect(r.isComplete).toBe(true);
  });

  it('isComplete=false quando falta um campo obrigatório', () => {
    const r = parse(['--theme', 'JWT', '--action', 'implemente']);
    expect(r.isComplete).toBe(false);
  });
});

describe('parseArgs — validação de valores inválidos', () => {
  it('lança em --category inválida', () => {
    expect(() => parse(['--category', 'invalida'])).toThrow('process.exit');
  });

  it('lança em --tone inválido', () => {
    expect(() => parse(['--tone', 'agressivo'])).toThrow('process.exit');
  });

  it('lança em --format inválido', () => {
    expect(() => parse(['--format', 'pdf'])).toThrow('process.exit');
  });
});

describe('parseArgs — hasCliInput', () => {
  it('hasCliInput=false quando nenhuma flag é passada', () => {
    const r = parse([]);
    expect(r.hasCliInput).toBe(false);
  });

  it('hasCliInput=true quando qualquer flag -- é passada', () => {
    const r = parse(['--theme', 'x']);
    expect(r.hasCliInput).toBe(true);
  });
});
