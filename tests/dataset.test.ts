import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exportDataset } from '../src/core/dataset';
import { FeedbackStore } from '../src/core/store';
import { PromptFeedback } from '../src/core/learning';

const FB = (rating: 1 | 2 | 3 | 4 | 5, prompt = 'prompt gerado'): PromptFeedback => ({
  config: {
    action: 'Escreva', theme: 'JWT', format: 'code',
    audience: 'dev', objective: 'autenticar', tone: 'technical', category: 'code',
  },
  generatedPrompt: prompt,
  rating,
  usedVariation: 'direct',
  timestamp: Date.now(),
});

describe('exportDataset', () => {
  let store: FeedbackStore;
  let outFile: string;

  beforeEach(() => {
    store = new FeedbackStore();
    store.clear();
    outFile = path.join(os.tmpdir(), `dataset-test-${Date.now()}.jsonl`);
  });

  afterEach(() => {
    store.clear();
    if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
  });

  it('exporta apenas feedbacks com rating >= minRating', () => {
    store.save(FB(5, 'bom prompt'));
    store.save(FB(3, 'prompt médio'));
    store.save(FB(4, 'prompt ok'));
    exportDataset(outFile, 4);
    const lines = fs.readFileSync(outFile, 'utf-8').trim().split('\n');
    expect(lines).toHaveLength(2);
    const parsed = lines.map(l => JSON.parse(l));
    expect(parsed.every((s: any) => s.output !== 'prompt médio')).toBe(true);
  });

  it('gera JSONL no formato Alpaca (instruction, input, output)', () => {
    store.save(FB(5, 'prompt excelente'));
    exportDataset(outFile, 4);
    const sample = JSON.parse(fs.readFileSync(outFile, 'utf-8').trim());
    expect(sample).toHaveProperty('instruction');
    expect(sample).toHaveProperty('input', '');
    expect(sample).toHaveProperty('output', 'prompt excelente');
  });

  it('não cria arquivo quando não há exemplos suficientes', () => {
    store.save(FB(2));
    exportDataset(outFile, 4);
    expect(fs.existsSync(outFile)).toBe(false);
  });

  it('usa minRating=4 como padrão', () => {
    store.save(FB(4, 'bom'));
    store.save(FB(3, 'médio'));
    exportDataset(outFile);
    const lines = fs.readFileSync(outFile, 'utf-8').trim().split('\n');
    expect(lines).toHaveLength(1);
  });
});
