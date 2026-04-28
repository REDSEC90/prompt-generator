import chalk from 'chalk';
import { generatePrompt } from './generator';
import { FeedbackStore } from './store';

/**
 * Resultado de uma comparação A/B entre baseline e modelo fine-tunado.
 */
export interface EvalResult {
  goal: string;
  baseline: string;
  finetuned: string;
}

/**
 * Compara o modelo baseline (ex: llama3.2) com o modelo fine-tunado
 * (ex: prompt-generator) para uma lista de objetivos.
 *
 * Troca o AI_MODEL via variável de ambiente entre as chamadas.
 * Requer AI_PROVIDER=ollama em ambos os casos.
 *
 * Critério de aprovação: avaliação manual de 20 exemplos.
 * Se o fine-tunado ganhar em 14+ (≥70%), usar como padrão.
 *
 * @param goals         - Lista de objetivos de teste.
 * @param baselineModel - Nome do modelo baseline (padrão: llama3.2).
 * @param finetunedModel- Nome do modelo fine-tunado (padrão: prompt-generator).
 */
export async function runEval(
  goals: string[],
  baselineModel  = 'llama3.2',
  finetunedModel = 'prompt-generator',
): Promise<EvalResult[]> {
  const store    = new FeedbackStore();
  const history  = store.load();
  const results: EvalResult[] = [];

  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║') + chalk.bold.white('     AVALIAÇÃO A/B — PROMPT EVAL      ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════╝'));
  console.log(chalk.dim(`\nBaseline  : ${baselineModel}`));
  console.log(chalk.dim(`Fine-tunado: ${finetunedModel}`));
  console.log(chalk.dim(`Objetivos  : ${goals.length}\n`));

  for (let i = 0; i < goals.length; i++) {
    const goal = goals[i];
    console.log(chalk.bold(`\n[${i + 1}/${goals.length}] Objetivo: ${goal}`));
    console.log(chalk.dim('─'.repeat(60)));

    // Gerar com baseline
    process.env.AI_MODEL = baselineModel;
    console.log(chalk.yellow(`\n  [Baseline — ${baselineModel}]`));
    const baseline = await generatePrompt(goal, history);

    // Gerar com fine-tunado
    process.env.AI_MODEL = finetunedModel;
    console.log(chalk.green(`\n  [Fine-tunado — ${finetunedModel}]`));
    const finetuned = await generatePrompt(goal, history);

    results.push({ goal, baseline, finetuned });

    console.log(chalk.dim('\n─── BASELINE ───'));
    console.log(chalk.dim(baseline));
    console.log(chalk.dim('\n─── FINE-TUNADO ───'));
    console.log(chalk.dim(finetuned));
  }

  // Resumo
  console.log(chalk.bold.cyan('\n╔══════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║') + chalk.bold.white('              RESUMO EVAL             ') + chalk.bold.cyan('║'));
  console.log(chalk.bold.cyan('╚══════════════════════════════════════╝'));
  console.log(`\nTotal de comparações: ${results.length}`);
  console.log(chalk.dim('Critério de aprovação: fine-tunado melhor em ≥70% dos exemplos (avaliação manual).'));
  console.log(chalk.dim('\nAvaliar: para cada par acima, marque qual prompt é melhor.'));
  console.log(chalk.dim('Se fine-tunado ganhar em 14+/20 → set AI_MODEL=prompt-generator no .env'));

  return results;
}

// ── Entry point CLI ────────────────────────────────────────────────────────────
// Uso: npm run eval
// Ou:  npx ts-node src/core/eval.ts "objetivo 1" "objetivo 2" ...

if (require.main === module) {
  const cliGoals = process.argv.slice(2);

  // Objetivos padrão para teste se nenhum for passado
  const DEFAULT_GOALS = [
    'Criar um endpoint REST em Node.js com autenticação JWT',
    'Resumir artigo técnico sobre microserviços para desenvolvedores júnior',
    'Escrever copy de email marketing para lançamento de curso online',
    'Gerar 10 ideias de negócio no nicho de SaaS para pequenas empresas',
    'Traduzir documentação técnica de inglês para português mantendo termos técnicos',
  ];

  const goals = cliGoals.length > 0 ? cliGoals : DEFAULT_GOALS;

  runEval(goals).catch(err => {
    console.error(chalk.red('\nErro na avaliação: ') + err.message);
    process.exit(1);
  });
}
