import ora from 'ora';
import chalk from 'chalk';
import { RetryManager } from './retry';

const SYSTEM_PROMPT =
  'Você é um assistente especializado. Responda sempre em Markdown. ' +
  'Seja preciso e objetivo. Se não souber algo, diga explicitamente.';

async function stream(res: Response): Promise<string> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buffer = '';

  console.log('\n' + chalk.bold.green('─── RESPOSTA ───') + '\n');

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const payload = event
        .split('\n')
        .filter(line => line.startsWith('data: '))
        .map(line => line.slice(6).trim())
        .filter(Boolean)
        .join('\n');

      if (!payload || payload === '[DONE]') continue;

      try {
        const data = JSON.parse(payload);
        const chunk =
          data.type === 'content_block_delta'
            ? (data.delta?.text ?? '')
            : (data.choices?.[0]?.delta?.content ?? '');
        full += chunk;
        process.stdout.write(chunk);
      } catch {
        // Ignora eventos sem payload textual renderizável.
      }
    }

    if (done) break;
  }
  console.log('\n');
  return full;
}

async function callAnthropic(prompt: string, apiKey: string): Promise<string> {
  const spinner = ora({ text: chalk.dim('Conectando à Anthropic…'), color: 'cyan' }).start();
  const retry = new RetryManager();
  try {
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
          max_tokens: parseInt(process.env.AI_MAX_TOKENS ?? '4000', 10),
          system: SYSTEM_PROMPT,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        }),
      }).then(r => { if (!r.ok) { const e: any = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; } return r; })
    );
    spinner.stop();
    return stream(res);
  } catch (e) {
    spinner.fail(chalk.red('Falha na conexão com Anthropic.'));
    throw e;
  }
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const spinner = ora({ text: chalk.dim('Conectando à OpenAI…'), color: 'cyan' }).start();
  const retry = new RetryManager();
  try {
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
      }).then(r => { if (!r.ok) { const e: any = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; } return r; })
    );
    spinner.stop();
    return stream(res);
  } catch (e) {
    spinner.fail(chalk.red('Falha na conexão com OpenAI.'));
    throw e;
  }
}

export async function sendToAI(prompt: string): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    console.log('\n' + chalk.yellow('⚠  Modo offline — AI_API_KEY não configurada') + '\n');
    console.log(chalk.bold('Prompt gerado:\n'));
    console.log(chalk.dim(prompt));
    return '';
  }
  const provider = process.env.AI_PROVIDER ?? 'anthropic';
  if (provider === 'anthropic') return callAnthropic(prompt, apiKey);
  if (provider === 'openai')    return callOpenAI(prompt, apiKey);
  throw new Error(`Provider desconhecido: "${provider}". Use "anthropic" ou "openai".`);
}
