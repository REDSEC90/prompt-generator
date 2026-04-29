/**
 * Testes para PromptStore.rename e casos de borda — src/core/prompt-store.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { PromptStore } from '../src/core/prompt-store';
import { PromptConfig } from '../src/core/types';

const store = new PromptStore();

const config: PromptConfig = {
  theme: 'JWT', action: 'implemente', category: 'code',
  audience: 'dev', objective: 'middleware', tone: 'technical', format: 'code',
};

beforeEach(() => {
  if (fs.existsSync(store.storePath)) fs.unlinkSync(store.storePath);
});

afterEach(() => {
  if (fs.existsSync(store.storePath)) fs.unlinkSync(store.storePath);
});

describe('PromptStore — rename', () => {
  it('renomeia um prompt existente', () => {
    store.save('original', 'prompt text', config);
    const ok = store.rename('original', 'novo');
    expect(ok).toBe(true);
    expect(store.get('novo')).toBeDefined();
    expect(store.get('original')).toBeUndefined();
  });

  it('retorna false ao renomear nome inexistente', () => {
    const ok = store.rename('nao-existe', 'outro');
    expect(ok).toBe(false);
  });

  it('preserva o prompt e config após renomear', () => {
    store.save('original', 'meu prompt', config);
    store.rename('original', 'novo');
    const saved = store.get('novo');
    expect(saved?.prompt).toBe('meu prompt');
    expect(saved?.config.category).toBe('code');
    expect(saved?.name).toBe('novo');
  });

  it('atualiza updatedAt ao renomear', () => {
    store.save('original', 'prompt', config);
    const before = store.get('original')!.updatedAt;
    // garante diferença de timestamp
    jest.spyOn(Date, 'now').mockReturnValue(before + 1000);
    store.rename('original', 'novo');
    jest.restoreAllMocks();
    expect(store.get('novo')!.updatedAt).toBeGreaterThan(before);
  });
});

describe('PromptStore — save e sobrescrita', () => {
  it('preserva createdAt ao sobrescrever', () => {
    store.save('p', 'v1', config);
    const created = store.get('p')!.createdAt;
    jest.spyOn(Date, 'now').mockReturnValue(created + 5000);
    store.save('p', 'v2', config);
    jest.restoreAllMocks();
    expect(store.get('p')!.createdAt).toBe(created);
    expect(store.get('p')!.prompt).toBe('v2');
  });
});

describe('PromptStore — list', () => {
  it('retorna lista vazia quando não há prompts', () => {
    expect(store.list()).toEqual([]);
  });

  it('ordena por updatedAt decrescente', () => {
    const t = Date.now();
    jest.spyOn(Date, 'now').mockReturnValueOnce(t).mockReturnValueOnce(t + 1000);
    store.save('a', 'pa', config);
    store.save('b', 'pb', config);
    jest.restoreAllMocks();
    const list = store.list();
    expect(list[0].name).toBe('b');
    expect(list[1].name).toBe('a');
  });
});

describe('PromptStore — get e delete', () => {
  it('retorna undefined para nome inexistente', () => {
    expect(store.get('nao-existe')).toBeUndefined();
  });

  it('delete retorna false para nome inexistente', () => {
    expect(store.delete('nao-existe')).toBe(false);
  });

  it('delete retorna true e remove o prompt', () => {
    store.save('p', 'texto', config);
    expect(store.delete('p')).toBe(true);
    expect(store.get('p')).toBeUndefined();
  });
});

describe('PromptStore — arquivo corrompido', () => {
  it('retorna lista vazia quando o arquivo JSON está corrompido', () => {
    fs.mkdirSync(path.dirname(store.storePath), { recursive: true });
    fs.writeFileSync(store.storePath, 'INVALID JSON');
    expect(store.list()).toEqual([]);
  });
});
