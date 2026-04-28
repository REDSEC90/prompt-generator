#!/usr/bin/env ts-node
/**
 * CLI para executar treinamento automatizado do Ollama
 * 
 * Uso:
 *   npm run train              # 50 iterações padrão
 *   npm run train 100          # 100 iterações
 *   npm run train 200 3000     # 200 iterações com delay de 3s
 */

import { AutoTrainer } from './core/auto-trainer';

async function main() {
  const args = process.argv.slice(2);
  const iterations = parseInt(args[0] ?? '50', 10);
  const delayMs = parseInt(args[1] ?? '2000', 10);

  if (isNaN(iterations) || iterations < 1) {
    console.error('❌ Número de iterações inválido');
    process.exit(1);
  }

  const trainer = new AutoTrainer();

  try {
    const metrics = await trainer.runTrainingLoop(iterations, delayMs);
    trainer.displayMetrics(metrics);
  } catch (err) {
    console.error('\n❌ Erro fatal no treinamento:', err);
    process.exit(1);
  }
}

main();
