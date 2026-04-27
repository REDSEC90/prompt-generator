import { select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { GeneratedPrompt } from '../core/types';

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
