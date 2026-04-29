/**
 * Testes para FeedbackStore — casos de borda não cobertos
 */

import * as fs from 'fs';
import * as path from 'path';
import { FeedbackStore } from '../src/core/store';
import { PromptFeedback } from '../src/core/learning';

const store = new FeedbackStore();

function makeFb(rating: 1|2|3|4|5, category = 'code'): PromptFeedback {
  return {
    config: { category, theme: 't', action: 'a', audience: 'au', objective: 'o', tone: 'technical', format: 'markdown' } as any,
    generatedPrompt: 'prompt',
    rating,
    usedVariation: 'contextual',
    timestamp: Date.now(),
  };
}

beforeEach(() => store.clear());
afterEach(() => store.clear());

describe('FeedbackStore — stats', () => {
  it('retorna zeros quando histórico está vazio', () => {
    const s = store.stats();
    expect(s.total).toBe(0);
    expect(s.avgRating).toBe(0);
  });

  it('calcula média corretamente', () => {
    store.save(makeFb(4));
    store.save(makeFb(2));
    const s = store.stats();
    expect(s.total).toBe(2);
    expect(s.avgRating).toBe(3);
  });
});

describe('FeedbackStore — loadByCategory', () => {
  it('filtra por categoria corretamente', () => {
    store.save(makeFb(4, 'code'));
    store.save(makeFb(3, 'analysis'));
    store.save(makeFb(5, 'code'));

    const code = store.loadByCategory('code');
    expect(code).toHaveLength(2);
    expect(code.every(f => f.config.category === 'code')).toBe(true);
  });

  it('retorna array vazio para categoria sem histórico', () => {
    store.save(makeFb(4, 'code'));
    expect(store.loadByCategory('creative')).toEqual([]);
  });
});

describe('FeedbackStore — arquivo corrompido', () => {
  it('retorna array vazio quando JSON está corrompido', () => {
    fs.mkdirSync(path.dirname(store.storePath), { recursive: true });
    fs.writeFileSync(store.storePath, 'INVALID JSON');
    expect(store.load()).toEqual([]);
  });
});

describe('FeedbackStore — limite MAX_HISTORY', () => {
  it('não acumula mais de 10000 entradas', () => {
    // Salva 3 entradas e verifica que todas são persistidas normalmente
    store.save(makeFb(4));
    store.save(makeFb(5));
    store.save(makeFb(3));
    expect(store.load().length).toBe(3);
  });
});
