import { Category, OutputFormat, PromptConfig } from './types';

export function formatLabel(format: OutputFormat): string {
  const map: Record<OutputFormat, string> = {
    markdown:       'Markdown com seções H2 e bullet points',
    json:           'JSON válido',
    table:          'tabela Markdown',
    'numbered-list':'lista numerada',
    prose:          'texto corrido em parágrafos',
    html:           'HTML semântico',
    code:           'bloco de código com comentários',
  };
  return map[format] ?? format;
}

export function toneLabel(tone: string): string {
  const map: Record<string, string> = {
    formal:       'formal e objetivo',
    friendly:     'amigável e acessível',
    persuasive:   'persuasivo, com senso de urgência',
    didactic:     'didático e progressivo',
    journalistic: 'jornalístico, direto',
    technical:    'técnico e preciso',
  };
  return map[tone] ?? tone;
}

/** Monta linhas do prompt filtrando valores falsy para evitar linhas em branco. */
function lines(...parts: (string | false | undefined | null)[]): string {
  return parts.filter(Boolean).join('\n');
}

function meaningful(value?: string): string | false {
  if (!value) return false;
  const normalized = value.trim();
  return normalized && normalized !== '-' ? normalized : false;
}

function hasRestrictions(c: PromptConfig): string | false {
  return (c.restrictions?.length ?? 0) > 0 && `${c.restrictions!.join(', ')}`;
}

const TEMPLATES: Record<Category, (c: PromptConfig) => string> = {
  summary: (c) => lines(
    `Crie um resumo sobre ${c.theme}.`,
    `Formato de saída: ${formatLabel(c.format)}.`,
    meaningful(c.audience)  && `Público-alvo: ${meaningful(c.audience)}.`,
    meaningful(c.objective) && `Objetivo: ${meaningful(c.objective)}.`,
    `Tom: ${toneLabel(c.tone)}.`,
    c.limit       && `Limite: ${c.limit}.`,
    hasRestrictions(c) && `Evitar: ${hasRestrictions(c)}.`,
    c.fewShot     && `Exemplo de saída:\nInput: "${c.fewShot.input}"\nOutput: "${c.fewShot.output}"`,
    c.chainOfThought && 'Antes de responder, liste os pontos principais que serão cobertos e justifique a seleção.',
  ),

  code: (c) => lines(
    `Escreva ${c.action} em ${c.language ?? c.theme}.`,
    meaningful(c.objective) && `Descrição funcional: ${meaningful(c.objective)}.`,
    `Saída esperada: código funcional + docstring + testes unitários.`,
    `Formato de saída: ${formatLabel(c.format)}.`,
    meaningful(c.audience) && `Contexto: ${meaningful(c.audience)}.`,
    `Estilo: ${toneLabel(c.tone)}.`,
    c.limit       && `Limite de complexidade: ${c.limit}.`,
    hasRestrictions(c) && `Restrições: ${hasRestrictions(c)}.`,
    c.fewShot     && `Exemplo:\nInput: "${c.fewShot.input}"\nOutput: "${c.fewShot.output}"`,
  ),

  analysis: (c) => lines(
    `${c.action} ${c.theme}.`,
    meaningful(c.objective) && `Critérios: ${meaningful(c.objective)}.`,
    `Formato de saída: ${formatLabel(c.format)}.`,
    meaningful(c.audience) && `Público: ${meaningful(c.audience)}.`,
    `Tom: ${toneLabel(c.tone)}.`,
    c.limit       && `Limite: ${c.limit}.`,
    hasRestrictions(c) && `Restrições: ${hasRestrictions(c)}.`,
    c.fewShot     && `Exemplo de linha: "${c.fewShot.output}"`,
    c.chainOfThought && 'Antes de gerar a saída, liste os critérios considerados e justifique a inclusão de cada um.',
  ),

  marketing: (c) => lines(
    `Crie ${c.action} para ${c.theme}.`,
    meaningful(c.audience) && `Público-alvo: ${meaningful(c.audience)}.`,
    meaningful(c.objective) && `Objetivo: ${meaningful(c.objective)}.`,
    `Tom: ${toneLabel(c.tone)}.`,
    `Formato de saída: ${formatLabel(c.format)}.`,
    c.limit       && `Limite: ${c.limit}.`,
    hasRestrictions(c) && `Evitar: ${hasRestrictions(c)}.`,
    c.fewShot     && `Exemplo de referência:\n"${c.fewShot.output}"`,
  ),

  brainstorming: (c) => lines(
    `Gere ${c.action} no nicho de ${c.theme}.`,
    meaningful(c.objective) && `Cada ideia deve conter: ${meaningful(c.objective)}.`,
    c.limit       && `Quantidade: ${c.limit}.`,
    hasRestrictions(c) && `Restrições: ${hasRestrictions(c)}.`,
    c.fewShot     && `Exemplo de formato:\n"${c.fewShot.output}"`,
    c.chainOfThought && 'Para cada ideia, explique o raciocínio por trás do diferencial de mercado.',
  ),

  translation: (c) => lines(
    `Traduza o seguinte conteúdo sobre ${c.theme}.`,
    meaningful(c.language) && `Idioma de destino: ${meaningful(c.language)}.`,
    meaningful(c.objective) && `Contexto: ${meaningful(c.objective)}.`,
    `Tom: ${toneLabel(c.tone)}.`,
    `Formato de saída: ${formatLabel(c.format)}.`,
    meaningful(c.audience) && `Público-alvo: ${meaningful(c.audience)}.`,
    hasRestrictions(c) && `Evitar: ${hasRestrictions(c)}.`,
    c.fewShot     && `Exemplo:\nOriginal: "${c.fewShot.input}"\nTradução: "${c.fewShot.output}"`,
    c.chainOfThought && 'Antes de traduzir, identifique termos técnicos ou culturais que exigem adaptação e justifique as escolhas.',
  ),

  qa: (c) => lines(
    `Gere ${c.action} sobre ${c.theme}.`,
    meaningful(c.objective) && `Critério de qualidade: ${meaningful(c.objective)}.`,
    `Formato de saída: ${formatLabel(c.format)}.`,
    meaningful(c.audience) && `Contexto de uso: ${meaningful(c.audience)}.`,
    `Tom: ${toneLabel(c.tone)}.`,
    c.limit       && `Quantidade: ${c.limit}.`,
    hasRestrictions(c) && `Restrições: ${hasRestrictions(c)}.`,
    c.fewShot     && `Exemplo de par Q&A:\nPergunta: "${c.fewShot.input}"\nResposta: "${c.fewShot.output}"`,
    c.chainOfThought && 'Para cada pergunta, explique por que ela é relevante e o que a resposta deve cobrir.',
  ),

  creative: (c) => lines(
    `${c.action} sobre ${c.theme}.`,
    meaningful(c.objective) && `Intenção criativa: ${meaningful(c.objective)}.`,
    `Tom: ${toneLabel(c.tone)}.`,
    `Formato de saída: ${formatLabel(c.format)}.`,
    meaningful(c.audience) && `Público-alvo: ${meaningful(c.audience)}.`,
    c.limit       && `Extensão: ${c.limit}.`,
    hasRestrictions(c) && `Evitar: ${hasRestrictions(c)}.`,
    c.fewShot     && `Referência de estilo:\n"${c.fewShot.output}"`,
    c.chainOfThought && 'Antes de escrever, descreva o arco narrativo ou estrutura criativa que será seguida.',
  ),
};

export default TEMPLATES;
