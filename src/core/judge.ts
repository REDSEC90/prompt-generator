import { sendToAI } from './ai';
import { FailureReason } from './learning';

// Prompt combinado: gera E avalia em uma única chamada
const COMBINED_PROMPT = (goal: string, previous?: string, previousReason?: string) => {
  const rewriteSection = previous
    ? `\nO prompt anterior foi rejeitado por: ${previousReason ?? 'qualidade insuficiente'}.\nPrompt anterior:\n${previous}\n\nReescreva-o corrigindo o problema.`
    : '';

  return `Você é um especialista em engenharia de prompts.

Tarefa: gere um prompt otimizado para o objetivo abaixo${rewriteSection ? ' (reescrita)' : ''}.
O prompt deve ter: role, contexto, tarefa clara, formato de saída, restrições.
${rewriteSection}

Objetivo: ${goal}

Após gerar o prompt, avalie-o com este JSON (na última linha, sem texto depois):
{"score":<1-5>,"reason":"<too_vague|wrong_format|wrong_tone|missing_context|too_long|hallucinated|none>","critique":"<uma frase>"}`;
};

// Prompt de avaliação standalone (para judgePrompt isolado)
const JUDGE_PROMPT = (prompt: string) =>
  `Avalie o prompt abaixo em clareza, role, contexto, formato e restrições (0-1 cada).
Responda APENAS com JSON: {"score":<1-5>,"reason":"<too_vague|wrong_format|wrong_tone|missing_context|too_long|hallucinated|none>","critique":"<uma frase>"}

Prompt:
${prompt}`;

export interface JudgeResult {
  rating: 1 | 2 | 3 | 4 | 5;
  failureReason?: FailureReason;
  critique: string;
  generatedPrompt?: string;  // preenchido quando usa modo combinado
}

function extractJSON(raw: string): string {
  // Tenta última linha primeiro (modo combinado), depois qualquer JSON
  const lines = raw.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/\{[\s\S]*\}/);
    if (m) return m[0];
  }
  return raw;
}

function extractPromptBody(raw: string): string {
  // Tudo antes do JSON final é o prompt gerado
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
 * Gera E avalia um prompt em uma única chamada à IA.
 * Reduz o número de round-trips de 3 para 1 por iteração.
 */
export async function generateAndJudge(
  goal: string,
  previous?: string,
  previousReason?: string,
): Promise<JudgeResult> {
  try {
    const raw = await sendToAI(COMBINED_PROMPT(goal, previous, previousReason));
    const result = parseJudge(raw);
    result.generatedPrompt = extractPromptBody(raw);
    return result;
  } catch {
    return { rating: 3, critique: 'erro na geração', generatedPrompt: '' };
  }
}

/**
 * Avalia um prompt existente (sem gerar novo).
 */
export async function judgePrompt(prompt: string): Promise<JudgeResult> {
  try {
    const raw = await sendToAI(JUDGE_PROMPT(prompt));
    return parseJudge(raw);
  } catch {
    return { rating: 3, critique: 'falha no parse da avaliação' };
  }
}
