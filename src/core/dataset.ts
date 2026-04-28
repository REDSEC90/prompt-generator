import * as fs from 'fs';
import * as path from 'path';
import { FeedbackStore } from './store';

/**
 * Formato Alpaca — padrão esperado por Llama, Mistral e Phi no fine-tuning
 * com Unsloth / trl (Tarefa 3.2).
 */
interface AlpacaSample {
  instruction: string;
  input: string;
  output: string;
}

/**
 * Exporta o histórico de feedbacks como dataset JSONL no formato Alpaca.
 *
 * Apenas feedbacks com rating >= minRating são incluídos, garantindo que
 * o modelo aprenda somente com exemplos de qualidade.
 *
 * @param outputPath - Caminho do arquivo de saída (ex: "dataset.jsonl").
 * @param minRating  - Rating mínimo para inclusão (padrão: 4).
 */
export function exportDataset(outputPath: string, minRating = 4): void {
  const history = new FeedbackStore().load();

  const samples: AlpacaSample[] = history
    .filter(fb => fb.rating >= minRating)
    .map(fb => ({
      instruction: fb.config.objective,
      input: '',
      output: fb.generatedPrompt,
    }));

  if (samples.length === 0) {
    console.warn(
      `⚠  Nenhum feedback com rating >= ${minRating} encontrado. ` +
      'Acumule mais avaliações antes de exportar.'
    );
    return;
  }

  const dir = path.dirname(outputPath);
  if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });

  const lines = samples.map(s => JSON.stringify(s));
  fs.writeFileSync(outputPath, lines.join('\n'));

  console.log(`✔ Dataset exportado: ${samples.length} exemplos → ${outputPath}`);
  console.log(`  Distribuição por categoria:`);

  const byCategory: Record<string, number> = {};
  history
    .filter(fb => fb.rating >= minRating)
    .forEach(fb => {
      byCategory[fb.config.category] = (byCategory[fb.config.category] ?? 0) + 1;
    });

  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat.padEnd(16)} ${count} exemplos`);
  }
}

/**
 * Entry point para uso via linha de comando:
 * npx ts-node src/core/dataset.ts [outputPath] [minRating]
 */
if (require.main === module) {
  const outputPath = process.argv[2] ?? 'dataset.jsonl';
  const minRating  = parseInt(process.argv[3] ?? '4', 10);
  exportDataset(outputPath, minRating);
}
