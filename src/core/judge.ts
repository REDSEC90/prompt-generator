import { sendToAIFast } from './ai';
import { FailureReason } from './learning';

export interface JudgeResult {
  rating: 1 | 2 | 3 | 4 | 5;
  failureReason?: FailureReason;
  critique: string;
  generatedPrompt?: string;
}

// Gera o prompt — saída livre, até 250 tokens
const GEN_PROMPT = (goal: string, previous?: string, previousReason?: string) => {
  if (previous) {
    return `Reescreva este prompt melhorando o problema "${previousReason ?? 'qualidade'}":
${previous.slice(0, 300)}
Inclua: role, contexto, tarefa, formato de saída, restrições.`;
  }
  return `Escreva um prompt de IA para: "${goal}"
Inclua: role, contexto, tarefa, formato de saída, restrições.`;
};

// Avalia o prompt — resposta deve ser APENAS o JSON, até 60 tokens
const EVAL_PROMPT = (prompt: string) =>
  `Avalie este prompt de IA de 1 a 5.
Responda SOMENTE com: {"score":N,"reason":"X","critique":"Y"}
N=1-5, X=too_vague|wrong_format|wrong_tone|missing_context|too_long|hallucinated|none

Prompt: ${prompt.slice(0, 350)}`;

function extractJSON(raw: string): string {
  const idx = raw.lastIndexOf('"score"');
  if (idx > 0) {
    const s = raw.lastIndexOf('{', idx);
    const e = raw.indexOf('}', idx);
    if (s >= 0 && e > s) return raw.slice(s, e + 1);
  }
  const m = raw.match(/\{[^{}]*"score"[^{}]*\}/);
  return m ? m[0] : raw;
}

function parseJudge(raw: string): Omit<JudgeResult, 'generatedPrompt'> {
  try {
    const json = JSON.parse(extractJSON(raw));
    const score = Math.min(5, Math.max(1, Math.round(Number(json.score)))) as 1|2|3|4|5;
    const reason = json.reason && json.reason !== 'none' ? json.reason as FailureReason : undefined;
    return { rating: score, failureReason: reason, critique: String(json.critique ?? '') };
  } catch {
    return { rating: 3, critique: 'parse falhou' };
  }
}

/**
 * Gera um prompt (chamada 1) e avalia (chamada 2).
 * Duas chamadas curtas são mais confiáveis que uma longa no llama3.2:1b.
 */
export async function generateAndJudge(
  goal: string,
  previous?: string,
  previousReason?: string,
): Promise<JudgeResult> {
  try {
    // Chamada 1: gera o prompt (~250 tokens)
    const generatedPrompt = await sendToAIFast(GEN_PROMPT(goal, previous, previousReason), 250);

    // Chamada 2: avalia (~60 tokens, só JSON)
    const evalRaw = await sendToAIFast(EVAL_PROMPT(generatedPrompt), 60);
    const judged  = parseJudge(evalRaw);

    return { ...judged, generatedPrompt };
  } catch {
    return { rating: 3, critique: 'erro na geração', generatedPrompt: '' };
  }
}

/**
 * Avalia um prompt existente (só chamada 2).
 */
export async function judgePrompt(prompt: string): Promise<JudgeResult> {
  try {
    const raw = await sendToAIFast(EVAL_PROMPT(prompt), 60);
    return parseJudge(raw);
  } catch {
    return { rating: 3, critique: 'parse falhou' };
  }
}
