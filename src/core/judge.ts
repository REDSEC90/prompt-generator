import { sendToAIFast } from './ai';
import { FailureReason } from './learning';

// Prompt combinado ultra-curto: gera + avalia em 1 chamada, ~350 tokens de saída
const COMBINED_PROMPT = (goal: string, previous?: string, previousReason?: string) => {
  const fix = previous
    ? `\nAnterior rejeitado (${previousReason ?? 'ruim'}):\n${previous.slice(0, 300)}\nReescreva melhorando.`
    : '';
  return `Gere um prompt de IA para: "${goal}"
O prompt deve ter role, contexto, tarefa clara, formato de saída e restrições.${fix}

Escreva o prompt. Depois, na última linha, coloque SOMENTE este JSON:
{"score":N,"reason":"X","critique":"Y"}
Onde N=1-5, X=too_vague|wrong_format|wrong_tone|missing_context|too_long|hallucinated|none, Y=frase curta.`;
};

// Prompt de avaliação standalone — saída máxima: 80 tokens
const JUDGE_PROMPT = (prompt: string) =>
  `Avalie este prompt de IA (1-5): clareza, role, contexto, formato, restrições.
Responda SOMENTE com JSON: {"score":N,"reason":"X","critique":"Y"}

Prompt: ${prompt.slice(0, 400)}`;

export interface JudgeResult {
  rating: 1 | 2 | 3 | 4 | 5;
  failureReason?: FailureReason;
  critique: string;
  generatedPrompt?: string;
}

function extractJSON(raw: string): string {
  // 1. Tenta encontrar {"score": em qualquer posição
  const scoreIdx = raw.lastIndexOf('"score"');
  if (scoreIdx > 0) {
    const start = raw.lastIndexOf('{', scoreIdx);
    const end   = raw.indexOf('}', scoreIdx);
    if (start >= 0 && end > start) return raw.slice(start, end + 1);
  }
  // 2. Fallback: qualquer JSON na última linha
  const lines = raw.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/\{[\s\S]*\}/);
    if (m) return m[0];
  }
  return raw;
}

function extractPromptBody(raw: string): string {
  const jsonStart = raw.lastIndexOf('{"score"');
  return jsonStart > 0 ? raw.slice(0, jsonStart).trim() : raw.trim();
}

function parseJudge(raw: string): JudgeResult {
  try {
    const json = JSON.parse(extractJSON(raw));
    const score = Math.min(5, Math.max(1, Math.round(Number(json.score)))) as 1|2|3|4|5;
    const reason = json.reason && json.reason !== 'none' ? json.reason as FailureReason : undefined;
    return { rating: score, failureReason: reason, critique: String(json.critique ?? '') };
  } catch {
    return { rating: 3, critique: 'falha no parse' };
  }
}

/**
 * Gera E avalia em 1 chamada com num_predict=350 (rápido no hardware limitado).
 */
export async function generateAndJudge(
  goal: string,
  previous?: string,
  previousReason?: string,
): Promise<JudgeResult> {
  try {
    const raw = await sendToAIFast(COMBINED_PROMPT(goal, previous, previousReason), 350);
    const result = parseJudge(raw);
    result.generatedPrompt = extractPromptBody(raw);
    return result;
  } catch {
    return { rating: 3, critique: 'erro na geração', generatedPrompt: '' };
  }
}

/**
 * Avalia um prompt existente com num_predict=80 (só precisa do JSON).
 */
export async function judgePrompt(prompt: string): Promise<JudgeResult> {
  try {
    const raw = await sendToAIFast(JUDGE_PROMPT(prompt), 80);
    return parseJudge(raw);
  } catch {
    return { rating: 3, critique: 'falha no parse da avaliação' };
  }
}
