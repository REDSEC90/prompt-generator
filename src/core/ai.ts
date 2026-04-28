import ora from 'ora';
import chalk from 'chalk';
import { RetryManager } from './retry';

// ── Modos de execução ─────────────────────────────────────────────────────────
//
//  offline  — sem IA; exibe o prompt gerado pelos templates e retorna ''
//  local    — Ollama (http://localhost:11434); sem custo, sem internet
//  remote   — Anthropic ou OpenAI; requer AI_API_KEY
//  auto     — tenta local → remote → offline  (padrão quando AI_MODE não definido)
//
// Configuração via .env:
//   AI_MODE=auto|offline|local|remote   (padrão: auto)
//   AI_PROVIDER=ollama|anthropic|openai (padrão: ollama para local, anthropic para remote)
//   AI_API_KEY=...                      (obrigatório para remote)
//   AI_MODEL=...                        (opcional; usa padrão do provider)
//   OLLAMA_HOST=http://...              (padrão: http://localhost:11434)
//   OLLAMA_TIMEOUT=120000               (ms; padrão: 120000)

export type AIMode = 'offline' | 'local' | 'remote' | 'auto';

const SYSTEM_PROMPT =
  'Você é um assistente especializado. Responda sempre em Markdown. ' +
  'Seja preciso e objetivo. Se não souber algo, diga explicitamente.';

// ── helpers ───────────────────────────────────────────────────────────────────

function throwOnStatus(r: Response): Response {
  if (!r.ok) { const e: any = new Error(`HTTP ${r.status}`); e.status = r.status; throw e; }
  return r;
}

function printHeader(label: string): void {
  console.log('\n' + chalk.bold.green(`─── RESPOSTA (${label}) ───`) + '\n');
}

/** Verifica se o Ollama está acessível sem lançar exceção. */
async function ollamaAvailable(): Promise<boolean> {
  const base = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
  try {
    const r = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Ollama — streaming NDJSON ─────────────────────────────────────────────────

async function streamOllama(res: Response): Promise<string> {
  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buf  = '';

  printHeader('local · Ollama');

  while (true) {
    const { done, value } = await reader.read();
    if (value) buf += decoder.decode(value, { stream: !done });

    const lines = buf.split('\n');
    buf = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line) as { response?: string; done?: boolean };
        if (obj.response) { full += obj.response; process.stdout.write(obj.response); }
        if (obj.done)     { console.log('\n'); return full; }
      } catch { /* linha incompleta */ }
    }
    if (done) break;
  }
  console.log('\n');
  return full;
}

export async function callOllama(prompt: string, ollamaOpts?: Record<string, unknown>): Promise<string> {
  const model     = process.env.AI_MODEL    ?? 'prompt-generator';
  const base      = process.env.OLLAMA_HOST ?? 'http://localhost:11434';
  const timeoutMs = parseInt(process.env.OLLAMA_TIMEOUT ?? '300000', 10);

  const spinner = ora({ text: chalk.dim(`Ollama (${model})…`), color: 'green' }).start();

  try {
    const res = await new RetryManager().execute(() => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      return fetch(`${base}/api/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ model, prompt, stream: true, ...(ollamaOpts ? { options: ollamaOpts } : {}) }),
        signal:  controller.signal,
      }).then(r => { clearTimeout(timer); return throwOnStatus(r); })
       .catch(e => { clearTimeout(timer); throw e; });
    });

    spinner.stop();
    return streamOllama(res);
  } catch (e: any) {
    spinner.fail(chalk.red(
      e?.name === 'AbortError'
        ? `Ollama timeout (${timeoutMs / 1000}s). Aumente OLLAMA_TIMEOUT.`
        : 'Ollama indisponível.'
    ));
    throw e;
  }
}

// ── SSE (Anthropic / OpenAI) ──────────────────────────────────────────────────

async function streamSSE(res: Response, label: string): Promise<string> {
  const reader  = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';
  let buf  = '';

  printHeader(label);

  while (true) {
    const { done, value } = await reader.read();
    buf += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    const events = buf.split('\n\n');
    buf = events.pop() ?? '';

    for (const event of events) {
      const payload = event
        .split('\n')
        .filter(l => l.startsWith('data: '))
        .map(l => l.slice(6).trim())
        .filter(Boolean)
        .join('\n');

      if (!payload || payload === '[DONE]') continue;
      try {
        const data  = JSON.parse(payload);
        const chunk = data.type === 'content_block_delta'
          ? (data.delta?.text ?? '')
          : (data.choices?.[0]?.delta?.content ?? '');
        full += chunk;
        process.stdout.write(chunk);
      } catch { /* evento sem payload */ }
    }
    if (done) break;
  }
  console.log('\n');
  return full;
}

async function callAnthropic(prompt: string, apiKey: string): Promise<string> {
  const spinner = ora({ text: chalk.dim('Anthropic…'), color: 'cyan' }).start();
  try {
    const res = await new RetryManager().execute(() =>
      fetch('https://api.anthropic.com/v1/messages', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model:      process.env.AI_MODEL ?? 'claude-sonnet-4-6',
          max_tokens: parseInt(process.env.AI_MAX_TOKENS ?? '4000', 10),
          system:     SYSTEM_PROMPT,
          stream:     true,
          messages:   [{ role: 'user', content: prompt }],
        }),
      }).then(throwOnStatus)
    );
    spinner.stop();
    return streamSSE(res, 'remote · Anthropic');
  } catch (e) {
    spinner.fail(chalk.red('Falha na conexão com Anthropic.'));
    throw e;
  }
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const spinner = ora({ text: chalk.dim('OpenAI…'), color: 'cyan' }).start();
  try {
    const res = await new RetryManager().execute(() =>
      fetch('https://api.openai.com/v1/chat/completions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model:    process.env.AI_MODEL ?? 'gpt-4o',
          stream:   true,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: prompt },
          ],
        }),
      }).then(throwOnStatus)
    );
    spinner.stop();
    return streamSSE(res, 'remote · OpenAI');
  } catch (e) {
    spinner.fail(chalk.red('Falha na conexão com OpenAI.'));
    throw e;
  }
}

// ── modo offline ──────────────────────────────────────────────────────────────

function runOffline(prompt: string): string {
  console.log('\n' + chalk.yellow('⚠  Modo offline') + '\n');
  console.log(chalk.bold('Prompt gerado:\n'));
  console.log(chalk.dim(prompt));
  return '';
}

// ── roteador remoto ───────────────────────────────────────────────────────────

async function callRemote(prompt: string): Promise<string> {
  const apiKey   = process.env.AI_API_KEY;
  const provider = process.env.AI_PROVIDER ?? 'anthropic';

  if (!apiKey) throw new Error('AI_API_KEY não configurada para modo remote.');
  if (provider === 'anthropic') return callAnthropic(prompt, apiKey);
  if (provider === 'openai')    return callOpenAI(prompt, apiKey);
  throw new Error(`Provider remoto desconhecido: "${provider}". Use "anthropic" ou "openai".`);
}

// ── entry point ───────────────────────────────────────────────────────────────

export async function sendToAI(prompt: string): Promise<string> {
  const mode = (process.env.AI_MODE ?? 'auto') as AIMode;

  switch (mode) {
    case 'offline':
      return runOffline(prompt);

    case 'local':
      return callOllama(prompt);

    case 'remote':
      return callRemote(prompt);

    case 'auto':
    default: {
      // 1. Tentar local (Ollama) se disponível
      if (await ollamaAvailable()) {
        try { return await callOllama(prompt); } catch { /* fallback */ }
      }
      // 2. Tentar remoto se API key configurada
      if (process.env.AI_API_KEY) {
        try { return await callRemote(prompt); } catch { /* fallback */ }
      }
      // 3. Offline
      console.log(chalk.dim('\n  (auto) Nenhum provider disponível — modo offline.\n'));
      return runOffline(prompt);
    }
  }
}

/** Retorna o modo ativo e o provider resolvido para exibição na UI. */
export async function resolveAIStatus(): Promise<{ mode: AIMode; provider: string; available: boolean }> {
  const mode = (process.env.AI_MODE ?? 'auto') as AIMode;

  if (mode === 'offline') return { mode, provider: 'offline', available: true };

  if (mode === 'local' || (mode === 'auto' && await ollamaAvailable())) {
    const model = process.env.AI_MODEL ?? 'prompt-generator';
    return { mode: 'local', provider: `ollama/${model}`, available: true };
  }

  if (mode === 'remote' || (mode === 'auto' && process.env.AI_API_KEY)) {
    const provider = process.env.AI_PROVIDER ?? 'anthropic';
    const model    = process.env.AI_MODEL    ?? (provider === 'openai' ? 'gpt-4o' : 'claude-sonnet-4-6');
    return { mode: 'remote', provider: `${provider}/${model}`, available: !!process.env.AI_API_KEY };
  }

  return { mode: 'offline', provider: 'offline', available: false };
}

/**
 * Chamada Ollama otimizada para o loop autônomo:
 * - num_predict limitado (evita respostas longas desnecessárias)
 * - temperature=0 (respostas determinísticas)
 * - modelo configurável via AUTO_MODEL (padrão: llama3.2:1b)
 */
export async function sendToAIFast(
  prompt: string,
  numPredict = 300,
): Promise<string> {
  const savedModel = process.env.AI_MODEL;
  process.env.AI_MODEL = process.env.AUTO_MODEL ?? 'llama3.2:1b';
  try {
    return await callOllama(prompt, { num_predict: numPredict, temperature: 0 });
  } finally {
    if (savedModel !== undefined) process.env.AI_MODEL = savedModel;
    else delete process.env.AI_MODEL;
  }
}
