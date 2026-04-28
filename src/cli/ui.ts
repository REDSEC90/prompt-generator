import { select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { GeneratedPrompt, PromptConfig } from '../core/types';
import { FailureReason, PromptFeedback } from '../core/learning';
import { FeedbackStore } from '../core/store';

export async function pickVariation(v: GeneratedPrompt, preset?: '1' | '2' | '3'): Promise<string> {
  const map = { '1': v.direct, '2': v.contextual, '3': v.chainOfThought } as const;
  if (preset) return map[preset];

  const labels = {
    '1': chalk.yellow('Direta'),
    '2': chalk.cyan('Contextualizada'),
    '3': chalk.magenta('Chain-of-Thought'),
  } as const;

  const descriptions = {
    '1': 'Prompt enxuto para iteração rápida',
    '2': 'Prompt completo com todos os campos ativos',
    '3': 'Prompt completo com instruções de raciocínio explícito',
  } as const;

  while (true) {
    const choice = await select<'1' | '2' | '3' | 'preview-all'>({
      message: chalk.cyan('Selecione uma variação'),
      choices: [
        { value: '1', name: `${labels['1']} ${chalk.dim('— prompt mínimo')}` },
        { value: '2', name: `${labels['2']} ${chalk.dim('— equilíbrio geral')}` },
        { value: '3', name: `${labels['3']} ${chalk.dim('— resposta mais justificativa')}` },
        { value: 'preview-all', name: chalk.white('Ver todas antes de escolher') },
      ],
    });

    if (choice === 'preview-all') {
      printVariationPreview(v);
      continue;
    }

    console.log(`\n${chalk.bold(labels[choice])} ${chalk.dim(`— ${descriptions[choice]}`)}\n`);
    console.log(chalk.dim(map[choice]));
    console.log('');

    const confirmed = await confirm({
      message: chalk.cyan('Usar esta variação?'),
      default: true,
    });

    if (confirmed) return map[choice];
  }
}

export async function askExport(): Promise<boolean> {
  return confirm({
    message: chalk.cyan('Exportar prompt + resposta para arquivo .md?'),
    default: false,
  });
}

function printVariationPreview(v: GeneratedPrompt): void {
  const sep = chalk.dim('─'.repeat(60));

  console.log(`\n${sep}`);
  console.log(chalk.bold.yellow('\n  [1] DIRETA') + chalk.dim('  — enxuta, iteração rápida'));
  console.log(chalk.dim(v.direct.split('\n').map(l => '      ' + l).join('\n')));

  console.log(chalk.bold.cyan('\n  [2] CONTEXTUALIZADA') + chalk.dim('  — todos os campos'));
  console.log(chalk.dim(v.contextual.split('\n').map(l => '      ' + l).join('\n')));

  console.log(chalk.bold.magenta('\n  [3] CHAIN-OF-THOUGHT') + chalk.dim('  — raciocínio explícito'));
  console.log(chalk.dim(v.chainOfThought.split('\n').map(l => '      ' + l).join('\n')));
  console.log(`\n${sep}\n`);
}

// ── Tarefa 1.4 — Coleta de feedback após uso ──────────────────────────────────
export async function askFeedback(
  config: PromptConfig,
  generatedPrompt: string,
  usedVariation: 'direct' | 'contextual' | 'chainOfThought',
): Promise<PromptFeedback> {
  console.log(chalk.dim('\n─── AVALIAÇÃO DO PROMPT ───\n'));

  const rating = await select<1 | 2 | 3 | 4 | 5>({
    message: chalk.cyan('Avalie o prompt gerado (1-5):'),
    choices: [
      { value: 5, name: '5 — Excelente' },
      { value: 4, name: '4 — Bom' },
      { value: 3, name: '3 — Regular' },
      { value: 2, name: '2 — Ruim' },
      { value: 1, name: '1 — Inútil' },
    ],
  });

  let failureReason: FailureReason | undefined;
  if (rating <= 2) {
    failureReason = await select<FailureReason>({
      message: chalk.cyan('Qual foi o problema?'),
      choices: [
        { value: 'too_vague',       name: 'Muito vago — faltou contexto' },
        { value: 'wrong_format',    name: 'Formato errado' },
        { value: 'wrong_tone',      name: 'Tom inadequado ao público' },
        { value: 'missing_context', name: 'Faltou role ou restrições' },
        { value: 'too_long',        name: 'Resposta longa demais' },
        { value: 'hallucinated',    name: 'IA inventou informações' },
      ],
    });
  }

  const fb: PromptFeedback = {
    config,
    generatedPrompt,
    rating,
    usedVariation,
    failureReason,
    timestamp: Date.now(),
  };

  const store = new FeedbackStore();
  store.save(fb);
  const { total } = store.stats();
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  console.log(chalk.green(`\n✔ Feedback salvo ${stars}  (total: ${total} avaliações)`));
  return fb;
}
