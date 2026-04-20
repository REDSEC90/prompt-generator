import 'dotenv/config';
import * as readline from 'readline';
import { runQuestionFlow } from './cli/questions';
import { VariationGenerator } from './core/variations';
import { TemplateEngine } from './core/engine';
import { PromptConfig } from './core/types';

const SYSTEM_PROMPT = `Você é um assistente especializado. Responda sempre em Markdown. 
Seja preciso e objetivo. Se não souber algo, diga explicitamente.`;

async function pickVariation(variations: { direct: string; contextual: string; chainOfThought: string }): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q + '\n> ', res));

  console.log('\n─────────────────────────────────────────');
  console.log('VARIAÇÕES GERADAS\n');
  console.log('[1] DIRETA\n' + variations.direct);
  console.log('\n[2] CONTEXTUALIZADA\n' + variations.contextual);
  console.log('\n[3] CHAIN-OF-THOUGHT\n' + variations.chainOfThought);
  console.log('─────────────────────────────────────────');

  const choice = await ask('\nEscolha uma variação [1/2/3]:');
  rl.close();

  const map: Record<string, string> = { '1': variations.direct, '2': variations.contextual, '3': variations.chainOfThought };
  return map[choice.trim()] ?? variations.contextual;
}

async function sendToAI(prompt: string): Promise<void> {
  const apiKey = process.env.AI_API_KEY;
  const provider = process.env.AI_PROVIDER ?? 'anthropic';

  if (!apiKey) {
    console.log('\n[Modo offline — sem AI_API_KEY]\nPrompt gerado:\n\n' + prompt);
    return;
  }

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? 'claude-sonnet-4-5',
        max_tokens: parseInt(process.env.AI_MAX_TOKENS ?? '2000'),
        system: SYSTEM_PROMPT,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    console.log('\n─── RESPOSTA ───\n');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.type === 'content_block_delta') process.stdout.write(data.delta?.text ?? '');
        } catch {}
      }
    }
    console.log('\n');
  } else if (provider === 'openai') {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? 'gpt-4o',
        stream: true,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
      }),
    });

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    console.log('\n─── RESPOSTA ───\n');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: ') && !l.includes('[DONE]'));
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6));
          process.stdout.write(data.choices?.[0]?.delta?.content ?? '');
        } catch {}
      }
    }
    console.log('\n');
  }
}

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║     GERADOR DE PROMPTS INTELIGENTE   ║');
  console.log('╚══════════════════════════════════════╝\n');

  const answers = await runQuestionFlow();
  const config = answers as PromptConfig;

  const engine = new TemplateEngine();
  const { warnings } = engine.validate(config);
  if (warnings.length) warnings.forEach(w => console.warn('⚠️  ' + w));

  const generator = new VariationGenerator();
  const variations = generator.generate(config);

  const chosen = await pickVariation(variations);
  await sendToAI(chosen);
}

main().catch(console.error);
