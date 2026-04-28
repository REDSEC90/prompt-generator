import { sendToAI } from './ai';
import { PromptFeedback, FailureReason } from './learning';

// ── Tarefa 2.1 — Geração de prompts via meta-prompt ───────────────────────────

const META_PROMPT = `Você é um especialista em engenharia de prompts para LLMs.
Dado o objetivo abaixo, gere um prompt otimizado.
O prompt deve incluir: papel (role), contexto específico, tarefa clara,
formato de saída esperado, restrições e critério de qualidade.
Retorne apenas o prompt, sem explicações.`;

/**
 * Gera um prompt otimizado para um objetivo usando a própria IA.
 * Se houver histórico com rating >= 4, inclui até 3 exemplos como few-shot.
 *
 * @param goal     - Objetivo descrito pelo usuário em linguagem natural.
 * @param examples - Histórico de feedbacks para few-shot dinâmico.
 */
export async function generatePrompt(
  goal: string,
  examples: PromptFeedback[] = [],
): Promise<string> {
  const shots = examples
    .filter(e => e.rating >= 4)
    .slice(-3)
    .map(e => `Objetivo: "${e.config.objective}"\nPrompt:\n${e.generatedPrompt}`)
    .join('\n\n---\n\n');

  const prompt = [
    META_PROMPT,
    shots ? `\nExemplos de prompts bem avaliados:\n${shots}\n\n---` : '',
    `\nObjetivo: ${goal}`,
  ].filter(Boolean).join('\n');

  const result = await sendToAI(prompt);
  return result;
}

// ── Tarefa 2.2 — Reescrita automática de prompts ruins ────────────────────────

/**
 * Dicas de correção por motivo de falha.
 * Usadas no meta-prompt de reescrita para orientar a IA com precisão cirúrgica.
 */
const FAILURE_HINTS: Record<FailureReason, string> = {
  too_vague:       'adicione contexto específico e restrições claras',
  wrong_format:    'especifique a estrutura exata da saída esperada',
  wrong_tone:      'ajuste o tom para o público-alvo descrito',
  missing_context: 'adicione role, contexto de uso e critérios de qualidade',
  too_long:        'adicione limite de tamanho e instrução de concisão',
  hallucinated:    'adicione a instrução explícita: "Se não souber algo com certeza, diga explicitamente"',
};

/**
 * Reescreve um prompt que recebeu rating <= 2, usando o motivo da falha
 * como orientação para a IA corrigir de forma cirúrgica.
 *
 * @param original      - Texto do prompt original mal avaliado.
 * @param failureReason - Motivo da falha informado pelo usuário no feedback.
 */
export async function rewritePrompt(
  original: string,
  failureReason: FailureReason,
): Promise<string> {
  const hint = FAILURE_HINTS[failureReason] ?? 'melhore a clareza e especificidade';

  const meta = `O prompt abaixo foi mal avaliado porque: ${failureReason}.
Para corrigir, ${hint}.
Reescreva o prompt mantendo o objetivo original.
Retorne apenas o prompt reescrito, sem explicações.

Prompt original:
${original}`;

  return sendToAI(meta);
}
