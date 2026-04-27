import { PromptConfig, Category, OutputFormat, Tone } from '../core/types';

const HELP = `
Gerador de Prompts Inteligente

Uso interativo:
  npm start

Uso por flags:
  npm start -- --theme "X" --action "escreva" --category code [opções]

Uso híbrido:
  npm start -- --theme "X"
  Preenche o restante via wizard interativo com os valores informados como padrão.

Flags obrigatórias:
  --theme       Tema ou assunto principal
  --action      Verbo da tarefa (escreva, compare, liste...)
  --category    summary | code | analysis | marketing | brainstorming | translation | qa | creative
  --audience    Público-alvo
  --objective   Resultado esperado
  --tone        formal | friendly | persuasive | didactic | journalistic | technical
  --format      markdown | json | table | numbered-list | prose | html | code

Flags opcionais:
  --language    Linguagem de programação ou idioma de destino
  --limit       Limite de tamanho (ex: "200 palavras")
  --restrictions Restrições separadas por vírgula
  --few-shot-input   Entrada do exemplo few-shot
  --few-shot-output  Saída do exemplo few-shot
  --variation   1 (direta) | 2 (contextual) | 3 (chain-of-thought)  [padrão: interativo]
  --interactive Força o wizard interativo, mesmo com flags completas
  --no-send     Apenas exibe o prompt, não envia à API
  --export      Exporta automaticamente sem perguntar
  --help        Exibe esta ajuda
`.trim();

const REQUIRED_FIELDS: (keyof PromptConfig)[] = [
  'theme',
  'action',
  'category',
  'audience',
  'objective',
  'tone',
  'format',
];

export interface ParsedArgs {
  config: Partial<PromptConfig>;
  variation?: '1' | '2' | '3';
  noSend: boolean;
  autoExport: boolean;
  help: boolean;
  hasCliInput: boolean;
  forceInteractive: boolean;
  isComplete: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    process.exit(0);
  }

  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? args[i + 1] : undefined;
  };

  const config: Partial<PromptConfig> = {};
  const theme      = get('--theme');
  const action     = get('--action');
  const category   = get('--category') as Category | undefined;
  const audience   = get('--audience');
  const objective  = get('--objective');
  const tone       = get('--tone') as Tone | undefined;
  const format     = get('--format') as OutputFormat | undefined;
  const language   = get('--language');
  const limit      = get('--limit');
  const restrictions = get('--restrictions');
  const fewIn      = get('--few-shot-input');
  const fewOut     = get('--few-shot-output');
  const variation  = get('--variation') as '1' | '2' | '3' | undefined;
  const forceInteractive = args.includes('--interactive');

  if (theme)        config.theme       = theme;
  if (action)       config.action      = action;
  if (category)     config.category    = category;
  if (audience)     config.audience    = audience;
  if (objective)    config.objective   = objective;
  if (tone)         config.tone        = tone;
  if (format)       config.format      = format;
  if (language)     config.language    = language;
  if (limit)        config.limit       = limit;
  if (restrictions) config.restrictions = restrictions.split(',').map(s => s.trim());
  if (fewIn && fewOut) config.fewShot  = { input: fewIn, output: fewOut };

  const hasCliInput = args.some(arg => arg.startsWith('--') && arg !== '--interactive');
  const isComplete = REQUIRED_FIELDS.every(field => {
    const value = config[field];
    return value !== undefined && value !== null && String(value).trim() !== '';
  });

  return {
    config,
    variation,
    noSend:          args.includes('--no-send'),
    autoExport:      args.includes('--export'),
    help:            false,
    hasCliInput,
    forceInteractive,
    isComplete,
  };
}
