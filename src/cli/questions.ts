import { select, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { PromptConfig, Category, OutputFormat, Tone } from '../core/types';
import { CATEGORY_CHOICES, TONE_CHOICES, FORMAT_CHOICES, collectRequired, collectOptional } from './fields';

const CATEGORY_LABEL: Record<Category, string>     = Object.fromEntries(CATEGORY_CHOICES.map(c => [c.value, c.name.split('—')[0].trim()])) as Record<Category, string>;
const TONE_LABEL: Record<Tone, string>             = Object.fromEntries(TONE_CHOICES.map(c => [c.value, c.name.split('—')[0].trim()])) as Record<Tone, string>;
const FORMAT_LABEL: Record<OutputFormat, string>   = Object.fromEntries(FORMAT_CHOICES.map(c => [c.value, c.name.split('—')[0].trim()])) as Record<OutputFormat, string>;

function display(config: Partial<PromptConfig>): void {
  const row = (label: string, value: string | undefined) =>
    console.log(`  ${chalk.dim(label.padEnd(18))} ${value ? chalk.white(value) : chalk.dim('(vazio)')}`);

  console.log('\n' + chalk.bold('─── Configuração atual ───'));
  row('Tema',          config.theme);
  row('Ação',          config.action);
  row('Categoria',     config.category ? CATEGORY_LABEL[config.category] : undefined);
  row('Público',       config.audience);
  row('Objetivo',      config.objective);
  row('Tom',           config.tone ? TONE_LABEL[config.tone] : undefined);
  row('Formato',       config.format ? FORMAT_LABEL[config.format] : undefined);
  row('Linguagem',     config.language);
  row('Limite',        config.limit);
  row('Restrições',    config.restrictions?.join(', '));
  row('Few-shot',      config.fewShot ? `"${config.fewShot.input}" → "${config.fewShot.output}"` : undefined);
  console.log();
}

type ReviewAction = 'confirm' | 'edit-required' | 'edit-optional' | 'restart' | 'cancel';

async function reviewMenu(config: Partial<PromptConfig>): Promise<ReviewAction> {
  display(config);
  return select<ReviewAction>({
    message: chalk.cyan('O que deseja fazer?'),
    choices: [
      { value: 'confirm',       name: chalk.green('✔  Confirmar e continuar') },
      { value: 'edit-required', name: 'Editar campos obrigatórios' },
      { value: 'edit-optional', name: 'Editar campos opcionais' },
      { value: 'restart',       name: chalk.yellow('↺  Recomeçar do zero') },
      { value: 'cancel',        name: chalk.red('✖  Cancelar') },
    ],
  });
}

export async function runQuestionFlow(initial: Partial<PromptConfig> = {}): Promise<Partial<PromptConfig>> {
  console.log(chalk.dim('\n  Use ↑↓ para navegar, Enter para confirmar.\n'));

  let config: Partial<PromptConfig> = { ...initial };

  // Primeira passagem completa
  const required = await collectRequired(config);
  config = { ...config, ...required };
  const optional = await collectOptional(config, config.category!);
  config = { ...config, ...optional };

  // Loop de revisão
  while (true) {
    const action = await reviewMenu(config);

    if (action === 'confirm') return config;

    if (action === 'cancel') throw new Error('Execução cancelada pelo usuário.');

    if (action === 'restart') {
      config = {};
      const r = await collectRequired(config);
      config = { ...r };
      const o = await collectOptional(config, config.category!);
      config = { ...config, ...o };
      continue;
    }

    if (action === 'edit-required') {
      const r = await collectRequired(config);
      // Se categoria mudou, re-coleta opcionais para ajustar contexto de language
      if (r.category !== config.category) {
        config = { ...config, ...r };
        const o = await collectOptional(config, config.category!);
        config = { ...config, ...o };
      } else {
        config = { ...config, ...r };
      }
    }

    if (action === 'edit-optional') {
      const o = await collectOptional(config, config.category!);
      config = { ...config, ...o };
    }
  }
}
