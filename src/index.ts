import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { runQuestionFlow } from './cli/questions';
import { VariationGenerator } from './core/variations';
import { TemplateEngine } from './core/engine';
import { RetryManager } from './core/retry';
import { PromptConfig } from './core/types';

const SYSTEM_PROMPT =
  'Você é um assistente especializado. Responda sempre em Markdown. ' +
  'Seja preciso e objetivo. Se não souber algo, diga explicitamente.';

// ─── helpers ─────────────────────────────────────────────────────────────────

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(res => rl.question(question + '\n> ', ans => { rl.close(); res(ans.trim()); }));
}

function exportPrompt(prompt: string, response: string): void {
  const dir = path.join(process.cwd(), 'exports');
  fs.mkdirSync(dir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(dir, `prompt-${ts}.md`);
  fs.writeFileSync(file, `# Prompt\n\n${prompt}\n\n---\n\n# Resposta\n\n${response}\n`);
  console.log(`\n✔ Exportado: ${file}`);
}

// ─── variação picker ─────────────────────────────────────────────────────────

async function pickVariation(v: { direct: string; contextual: string; chainOfThought: string }): Promise<string> {
  const sep = '─'.repeat(50);
  console.log(`\n${sep}\n[1] DIRETA\n${v.direct}\n\n[2] CONTEXTUALIZADA\n${v.contextual}\n\n[3] CHAIN-OF-THOUGHT\n${v.chainOfThought}\n${sep}`);

  let choice = '';
  while (!['1', '2', '3'].includes(choice)) {
    choice = await ask('\nEscolha uma variação [1/2/3]:');
    if (!['1', '2', '3'].includes(choice)) console.log('  ⚠ Digite 1, 2 ou 3.');
  }

  return { '1': v.direct, '2': v.contextual, '3': v.chainOfThought }[choice]!;
}

// ─── streaming ───────────────────────────────────────────────────────────────

async function streamAnthropic(prompt: string, apiKey: string): Promise<string> {
  const retry = new RetryManager();
  const res = await retry.execute(() =>
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? 'claude-sonnet-4-5',
        max_tokens: parseInt(process.env.AI_MAX_TOKENS ?? '2000', 10),
        system: SYSTEM_PROMPT,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    }).then(r => {
      if (!r.ok) { const e: any = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; }
      return r;
    })
  );

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  console.log('\n─── RESPOSTA ───\n');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'content_block_delta') {
          const chunk = data.delta?.text ?? '';
          full += chunk;
          process.stdout.write(chunk);
        }
      } catch { /* linha incompleta — ignorar */ }
    }
  }
  console.log('\n');
  return full;
}

async function streamOpenAI(prompt: string, apiKey: string): Promise<string> {
  const retry = new RetryManager();
  const res = await retry.execute(() =>
    fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? 'gpt-4o',
        stream: true,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    }).then(r => {
      if (!r.ok) { const e: any = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; }
      return r;
    })
  );

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  console.log('\n─── RESPOSTA ───\n');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value).split('\n').filter(l => l.startsWith('data: ') && !l.includes('[DONE]'))) {
      try {
        const chunk = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content ?? '';
        full += chunk;
        process.stdout.write(chunk);
      } catch { /* linha incompleta — ignorar */ }
    }
  }
  console.log('\n');
  return full;
}

async function sendToAI(prompt: string): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    console.log('\n[Modo offline — AI_API_KEY não configurada]\n\nPrompt gerado:\n\n' + prompt);
    return '';
  }

  const provider = process.env.AI_PROVIDER ?? 'anthropic';
  if (provider === 'anthropic') return streamAnthropic(prompt, apiKey);
  if (provider === 'openai')    return streamOpenAI(prompt, apiKey);
  throw new Error(`Provider desconhecido: "${provider}". Use "anthropic" ou "openai".`);
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════╗');
  console.log('║     GERADOR DE PROMPTS INTELIGENTE   ║');
  console.log('╚══════════════════════════════════════╝\n');

  const answers = await runQuestionFlow();
  const config = answers as PromptConfig;

  const engine = new TemplateEngine();
  const { errors, warnings } = engine.validate(config);

  if (errors.length) {
    errors.forEach(e => console.error('✖ ' + e));
    process.exit(1);
  }
  warnings.forEach(w => console.warn('⚠  ' + w));

  const variations = new VariationGenerator().generate(config);
  const chosen = await pickVariation(variations);
  const response = await sendToAI(chosen);

  if (response) {
    const save = await ask('Exportar prompt + resposta para arquivo? [s/N]');
    if (save.toLowerCase() === 's') exportPrompt(chosen, response);
  }
}

main().catch(err => { console.error('Erro fatal:', err.message); process.exit(1); });
