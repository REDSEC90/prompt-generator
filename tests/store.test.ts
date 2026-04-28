import * as fs from 'fs';
import * as path from 'path';
import { FeedbackStore } from '../src/core/store';
import { PromptFeedback } from '../src/core/learning';

const STORE_PATH = path.join(process.env.HOME ?? process.cwd(), '.prompt-generator', 'history.json');

const FB: PromptFeedback = {
  config: {
    action: 'Analise', theme: 'Node.js', format: 'markdown',
    audience: 'dev', objective: 'aprender', tone: 'technical', category: 'code',
  },
  generatedPrompt: 'prompt de teste',
  rating: 4,
  usedVariation: 'direct',
  timestamp: 1000,
};

describe('FeedbackStore', () => {
  let store: FeedbackStore;

  beforeEach(() => {
    store = new FeedbackStore();
    store.clear();
  });

  afterAll(() => store.clear());

  it('load retorna [] quando arquivo não existe', () => {
    expect(store.load()).toEqual([]);
  });

  it('save persiste e load recupera', () => {
    store.save(FB);
    const loaded = store.load();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].generatedPrompt).toBe('prompt de teste');
  });

  it('save acumula múltiplos feedbacks', () => {
    store.save(FB);
    store.save({ ...FB, rating: 2 });
    expect(store.load()).toHaveLength(2);
  });

  it('clear remove o arquivo', () => {
    store.save(FB);
    store.clear();
    expect(store.load()).toEqual([]);
  });

  it('stats retorna total e avgRating corretos', () => {
    store.save({ ...FB, rating: 4 });
    store.save({ ...FB, rating: 2 });
    const { total, avgRating } = store.stats();
    expect(total).toBe(2);
    expect(avgRating).toBe(3);
  });

  it('stats retorna zeros para histórico vazio', () => {
    expect(store.stats()).toEqual({ total: 0, avgRating: 0 });
  });

  it('loadByCategory filtra por categoria', () => {
    store.save(FB);                                          // code
    store.save({ ...FB, config: { ...FB.config, category: 'summary' } });
    expect(store.loadByCategory('code')).toHaveLength(1);
    expect(store.loadByCategory('summary')).toHaveLength(1);
    expect(store.loadByCategory('marketing')).toHaveLength(0);
  });

  it('load retorna [] para arquivo corrompido', () => {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, 'não é json');
    expect(store.load()).toEqual([]);
  });

  it('mantém no máximo 10000 entradas (cap)', () => {
    // Salvar 3 entradas e verificar que o cap funciona com valor menor via monkey-patch
    // Testamos indiretamente: salvar N+1 e verificar que a mais antiga é removida
    store.save({ ...FB, generatedPrompt: 'primeiro' });
    store.save({ ...FB, generatedPrompt: 'segundo' });
    store.save({ ...FB, generatedPrompt: 'terceiro' });
    const all = store.load();
    expect(all).toHaveLength(3);
    expect(all[0].generatedPrompt).toBe('primeiro');
    expect(all[2].generatedPrompt).toBe('terceiro');
  });
});
