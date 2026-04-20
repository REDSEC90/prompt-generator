import * as readline from 'readline';
import { PromptConfig, Category, OutputFormat, Tone } from '../core/types';

const QUESTIONS = [
  { id: 'theme',    text: 'Qual é a sua ideia ou frase inicial?', type: 'free' },
  { id: 'action',   text: 'Qual verbo descreve a tarefa? (ex: escreva, compare, liste, crie)', type: 'free' },
  {
    id: 'category', text: 'Qual é o objetivo do prompt?', type: 'choice',
    options: ['Resumo', 'Código', 'Análise', 'Marketing', 'Brainstorming'],
    map: ['summary', 'code', 'analysis', 'marketing', 'brainstorming'] as Category[],
  },
  { id: 'audience', text: 'Quem vai consumir a saída?', type: 'free' },
  { id: 'objective', text: 'Qual o resultado esperado?', type: 'free' },
  {
    id: 'tone', text: 'Qual o tom desejado?', type: 'choice',
    options: ['Formal', 'Amigável', 'Persuasivo', 'Didático', 'Jornalístico', 'Técnico'],
    map: ['formal', 'friendly', 'persuasive', 'didactic', 'journalistic', 'technical'] as Tone[],
  },
  {
    id: 'format', text: 'Qual o formato de saída?', type: 'choice',
    options: ['Markdown', 'JSON', 'Tabela', 'Lista numerada', 'Texto corrido', 'HTML', 'Código'],
    map: ['markdown', 'json', 'table', 'numbered-list', 'prose', 'html', 'code'] as OutputFormat[],
  },
  { id: 'limit',        text: 'Limite de tamanho? (ex: 200 palavras) — Enter para pular', type: 'free', optional: true },
  { id: 'restrictions', text: 'Restrições? (ex: sem jargão) — Enter para pular', type: 'free', optional: true },
];

export async function runQuestionFlow(): Promise<Partial<PromptConfig>> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q + '\n> ', res));
  const answers: Partial<PromptConfig> = {};

  for (const q of QUESTIONS) {
    if (q.type === 'choice' && q.options) {
      console.log('\n' + q.text);
      q.options.forEach((opt, i) => console.log(`  [${i + 1}] ${opt}`));
      const raw = await ask('');
      const idx = parseInt(raw) - 1;
      (answers as any)[q.id] = (q.map as any[])?.[idx] ?? raw;
    } else {
      const raw = (await ask('\n' + q.text)).trim();
      if (raw) {
        if (q.id === 'restrictions') {
          (answers as any)[q.id] = [raw];
        } else {
          (answers as any)[q.id] = raw;
        }
      }
    }
  }

  rl.close();
  return answers;
}
