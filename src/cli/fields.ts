import { select, input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { PromptConfig, Category, OutputFormat, Tone } from '../core/types';

export const CATEGORY_CHOICES: { value: Category; name: string }[] = [
  { value: 'summary',       name: 'Resumo         — sínteses e resumos de conteúdo' },
  { value: 'code',          name: 'Código          — funções, scripts e APIs' },
  { value: 'analysis',      name: 'Análise         — comparações e diagnósticos' },
  { value: 'marketing',     name: 'Marketing       — copy e textos persuasivos' },
  { value: 'brainstorming', name: 'Brainstorming   — geração de ideias' },
  { value: 'translation',   name: 'Tradução        — tradução contextualizada' },
  { value: 'qa',            name: 'Q&A             — perguntas e respostas' },
  { value: 'creative',      name: 'Criativo        — narrativas e escrita criativa' },
];

export const TONE_CHOICES: { value: Tone; name: string }[] = [
  { value: 'formal',       name: 'Formal        — objetivo e impessoal' },
  { value: 'friendly',     name: 'Amigável      — acessível e próximo' },
  { value: 'persuasive',   name: 'Persuasivo    — com senso de urgência' },
  { value: 'didactic',     name: 'Didático      — progressivo e explicativo' },
  { value: 'journalistic', name: 'Jornalístico  — direto e factual' },
  { value: 'technical',    name: 'Técnico       — preciso e especializado' },
];

export const FORMAT_CHOICES: { value: OutputFormat; name: string }[] = [
  { value: 'markdown',      name: 'Markdown      — seções H2 + bullet points' },
  { value: 'prose',         name: 'Texto corrido — parágrafos contínuos' },
  { value: 'numbered-list', name: 'Lista numerada' },
  { value: 'table',         name: 'Tabela Markdown' },
  { value: 'json',          name: 'JSON          — estruturado e parseável' },
  { value: 'html',          name: 'HTML          — semântico' },
  { value: 'code',          name: 'Código        — bloco com comentários' },
];

function req(label: string) {
  return (v: string) => v.trim() ? true : chalk.red(`${label} é obrigatório.`);
}

/** Coleta os 7 campos obrigatórios. Valores de `initial` são usados como default. */
export async function collectRequired(initial: Partial<PromptConfig>): Promise<Required<Pick<PromptConfig,
  'theme' | 'action' | 'category' | 'audience' | 'objective' | 'tone' | 'format'
>>> {
  const theme = await input({
    message: chalk.cyan('Tema principal:'),
    default: initial.theme,
    validate: req('Tema'),
  });

  const action = await input({
    message: chalk.cyan('Verbo da tarefa') + chalk.dim(' (escreva, compare, liste…):'),
    default: initial.action,
    validate: req('Verbo'),
  });

  const category = await select<Category>({
    message: chalk.cyan('Categoria:'),
    choices: CATEGORY_CHOICES,
    default: initial.category,
  });

  const audience = await input({
    message: chalk.cyan('Público-alvo:'),
    default: initial.audience,
    validate: req('Público-alvo'),
  });

  const objective = await input({
    message: chalk.cyan('Resultado esperado:'),
    default: initial.objective,
    validate: req('Resultado esperado'),
  });

  const tone = await select<Tone>({
    message: chalk.cyan('Tom:'),
    choices: TONE_CHOICES,
    default: initial.tone,
  });

  const format = await select<OutputFormat>({
    message: chalk.cyan('Formato de saída:'),
    choices: FORMAT_CHOICES,
    default: initial.format,
  });

  return { theme, action, category, audience, objective, tone, format };
}

/** Coleta os campos opcionais. */
export async function collectOptional(
  initial: Partial<PromptConfig>,
  category: Category,
): Promise<Pick<PromptConfig, 'language' | 'limit' | 'restrictions' | 'fewShot'>> {
  const langMsg = category === 'code'
    ? chalk.cyan('Linguagem de programação') + chalk.dim(' (Enter para pular):')
    : category === 'translation'
      ? chalk.cyan('Idioma de destino') + chalk.dim(' (Enter para pular):')
      : chalk.cyan('Linguagem / idioma') + chalk.dim(' (Enter para pular):');

  const language = (await input({ message: langMsg, default: initial.language ?? '' })).trim() || undefined;

  const limit = (await input({
    message: chalk.cyan('Limite de tamanho') + chalk.dim(' (ex: 200 palavras — Enter para pular):'),
    default: initial.limit ?? '',
  })).trim() || undefined;

  const restrictionsRaw = (await input({
    message: chalk.cyan('Restrições') + chalk.dim(' (vírgula para separar — Enter para pular):'),
    default: initial.restrictions?.join(', ') ?? '',
  })).trim();
  const restrictions = restrictionsRaw ? restrictionsRaw.split(',').map(s => s.trim()).filter(Boolean) : undefined;

  const wantFewShot = await confirm({
    message: chalk.cyan('Adicionar exemplo few-shot?'),
    default: !!(initial.fewShot),
  });

  let fewShot: PromptConfig['fewShot'];
  if (wantFewShot) {
    const fsInput = await input({
      message: chalk.cyan('  Few-shot — entrada:'),
      default: initial.fewShot?.input,
      validate: req('Entrada'),
    });
    const fsOutput = await input({
      message: chalk.cyan('  Few-shot — saída esperada:'),
      default: initial.fewShot?.output,
      validate: req('Saída'),
    });
    fewShot = { input: fsInput, output: fsOutput };
  }

  return { language, limit, restrictions, fewShot };
}
