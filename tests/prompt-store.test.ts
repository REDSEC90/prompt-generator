import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PromptStore } from '../src/core/prompt-store';
import { PromptConfig } from '../src/core/types';

const TMP_DIR = path.join(os.tmpdir(), `prompt-store-test-${Date.now()}`);

const mockConfig: PromptConfig = {
  action: 'escreva', theme: 'JWT', format: 'code',
  audience: 'dev', objective: 'validar token', tone: 'technical', category: 'code',
};

let store: PromptStore;

beforeEach(() => {
  process.env.HOME = TMP_DIR;
  store = new PromptStore();
});

afterEach(() => {
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
});

describe('PromptStore — CRUD', () => {
  it('save() persiste e get() recupera o prompt', () => {
    store.save('meu-prompt', 'texto do prompt', mockConfig);
    const saved = store.get('meu-prompt');
    expect(saved).toBeDefined();
    expect(saved!.prompt).toBe('texto do prompt');
    expect(saved!.name).toBe('meu-prompt');
    expect(saved!.config.category).toBe('code');
  });

  it('get() retorna undefined para nome inexistente', () => {
    expect(store.get('nao-existe')).toBeUndefined();
  });

  it('list() retorna todos os prompts salvos', () => {
    store.save('a', 'prompt a', mockConfig);
    store.save('b', 'prompt b', mockConfig);
    const list = store.list();
    expect(list).toHaveLength(2);
    expect(list.map(p => p.name)).toEqual(expect.arrayContaining(['a', 'b']));
  });

  it('list() retorna array vazio quando não há prompts', () => {
    expect(store.list()).toEqual([]);
  });

  it('list() ordena por updatedAt desc', async () => {
    store.save('primeiro', 'p1', mockConfig);
    await new Promise(r => setTimeout(r, 5));
    store.save('segundo', 'p2', mockConfig);
    const list = store.list();
    expect(list[0].name).toBe('segundo');
    expect(list[1].name).toBe('primeiro');
  });

  it('delete() remove o prompt e retorna true', () => {
    store.save('remover', 'texto', mockConfig);
    expect(store.delete('remover')).toBe(true);
    expect(store.get('remover')).toBeUndefined();
  });

  it('delete() retorna false para nome inexistente', () => {
    expect(store.delete('nao-existe')).toBe(false);
  });

  it('save() sobrescreve prompt existente preservando createdAt', async () => {
    store.save('nome', 'v1', mockConfig);
    const original = store.get('nome')!;
    await new Promise(r => setTimeout(r, 5));
    store.save('nome', 'v2', mockConfig);
    const updated = store.get('nome')!;
    expect(updated.prompt).toBe('v2');
    expect(updated.createdAt).toBe(original.createdAt);
    expect(updated.updatedAt).toBeGreaterThan(original.updatedAt);
  });

  it('rename() renomeia o prompt', () => {
    store.save('antigo', 'texto', mockConfig);
    expect(store.rename('antigo', 'novo')).toBe(true);
    expect(store.get('antigo')).toBeUndefined();
    expect(store.get('novo')?.prompt).toBe('texto');
  });

  it('rename() retorna false para nome inexistente', () => {
    expect(store.rename('nao-existe', 'novo')).toBe(false);
  });

  it('persiste em disco e recarrega corretamente', () => {
    store.save('persistido', 'conteúdo', mockConfig);
    // nova instância lê do mesmo arquivo
    const store2 = new PromptStore();
    expect(store2.get('persistido')?.prompt).toBe('conteúdo');
  });
});
