import * as readline from 'readline';
import { PromptConfig, Category, OutputFormat, Tone } from '../core/types';

interface Question {
  id: keyof PromptConfig | 'restrictions';
  text: string;
  type: 'free' | 'choice';
  options?: string[];
  map?: readonly string[];
  optional?: boolean;
}

const QUESTIONS: Question[] = [
  { id: 'theme',     text: 'Qual é o tema ou assunto principal?', type: 'free' },
  { id: 'action',    text: 'Qual verbo descreve a tarefa? (ex: escreva, compare, liste, crie)', type: 'free' },
  {
    id: 'category',  text: 'Qual é o objetivo do prompt?', type: 'choice',
    options: ['Resumo', 'Código', 'Análise', 'Marketing', 'Brainstorming'],
    map: ['summary', 'code', 'analysis', 'marketing', 'brainstorming'] as const,
  },
  { id: 'audience',  text: 'Quem vai consumir a saída?', type: 'free' },
  { id: 'objective', text: 'Qual o resultado esperado?', type: 'free' },
  {
    id: 'tone',      text: 'Qual o tom desejado?', type: 'choice',
    options: ['Formal', 'Amigável', 'Persuasivo', 'Didático', 'Jornalístico', 'Técnico'],
    map: ['formal', 'friendly', 'persuasive', 'didactic', 'journalistic', 'technical'] as const,
  },
  {
    id: 'format',    text: 'Qual o formato de saída?', type: 'choice',
    options: ['Markdown', 'JSON', 'Tabela', 'Lista numerada', 'Texto corrido', 'HTML', 'Código'],
    map: ['markdown', 'json', 'table', 'numbered-list', 'prose', 'html', 'code'] as const,
  },
  { id: 'language',     text: 'Linguagem de programação? (só para código) — Enter para pular', type: 'free', optional: true },
  { id: 'limit',        text: 'Limite de tamanho? (ex: 200 palavras, 5 itens) — Enter para pular', type: 'free', optional: true },
  { id: 'restrictions', text: 'Restrições? (ex: sem jargão, sem libs externas) — Enter para pular', type: 'free', optional: true },
];

/**
 * Conduz o fluxo de perguntas interativo no terminal.
 * Retorna um PromptConfig parcial com as respostas do usuário.
 */
export async function runQuestionFlow(): Promise<Partial<PromptConfig>> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (prompt: string) => new Promise<string>(res => rl.question(prompt + '\n> ', res));
  const answers: Partial<PromptConfig> = {};

  for (const q of QUESTIONS) {
    if (q.type === 'choice' && q.options && q.map) {
      console.log('\n' + q.text);
      q.options.forEach((opt, i) => console.log(`  [${i + 1}] ${opt}`));

      let idx = -1;
      while (idx < 0 || idx >= q.options.length) {
        const raw = (await ask('')).trim();
        idx = parseInt(raw, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= q.options.length) {
          console.log(`  ⚠ Escolha entre 1 e ${q.options.length}.`);
          idx = -1;
        }
      }
      (answers as Record<string, unknown>)[q.id] = q.map[idx];

    } else {
      const raw = (await ask('\n' + q.text)).trim();
      if (raw) {
        (answers as Record<string, unknown>)[q.id] =
          q.id === 'restrictions' ? raw.split(',').map(s => s.trim()) : raw;
      }
    }
  }

  rl.close();
  return answers;
}
