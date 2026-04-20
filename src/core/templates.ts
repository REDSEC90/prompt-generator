import { Category, OutputFormat, PromptConfig } from './types';

export function formatLabel(format: OutputFormat): string {
  const map: Record<OutputFormat, string> = {
    markdown: 'Markdown com seções H2 e bullet points',
    json: 'JSON válido',
    table: 'tabela Markdown',
    'numbered-list': 'lista numerada',
    prose: 'texto corrido em parágrafos',
    html: 'HTML semântico',
    code: 'bloco de código com comentários',
  };
  return map[format] ?? format;
}

export function toneLabel(tone: string): string {
  const map: Record<string, string> = {
    formal: 'formal e objetivo',
    friendly: 'amigável e acessível',
    persuasive: 'persuasivo, com senso de urgência',
    didactic: 'didático e progressivo',
    journalistic: 'jornalístico, direto',
    technical: 'técnico e preciso',
  };
  return map[tone] ?? tone;
}

const TEMPLATES: Record<Category, (c: PromptConfig) => string> = {
  summary: (c) => [
    `Crie um resumo sobre ${c.theme}.`,
    `Formato de saída: ${formatLabel(c.format)}.`,
    c.audience && `Público-alvo: ${c.audience}.`,
    c.objective && `Objetivo: ${c.objective}.`,
    `Tom: ${toneLabel(c.tone)}.`,
    c.limit && `Limite: ${c.limit}.`,
    c.restrictions?.length && `Evitar: ${c.restrictions.join(', ')}.`,
    c.fewShot && `Exemplo de saída:\nInput: "${c.fewShot.input}"\nOutput: "${c.fewShot.output}"`,
    c.chainOfThought && 'Antes de responder, liste os pontos principais que serão cobertos e justifique a seleção.',
  ].filter(Boolean).join('\n'),

  code: (c) => [
    `Escreva ${c.action} em ${c.theme}.`,
    `Saída esperada: código funcional + docstring + testes unitários.`,
    c.audience && `Contexto: ${c.audience}.`,
    `Estilo: ${toneLabel(c.tone)}.`,
    c.restrictions?.length && `Restrições: ${c.restrictions.join(', ')}.`,
    c.fewShot && `Exemplo:\nInput: "${c.fewShot.input}"\nOutput: "${c.fewShot.output}"`,
  ].filter(Boolean).join('\n'),

  analysis: (c) => [
    `${c.action} ${c.theme}.`,
    c.objective && `Critérios: ${c.objective}.`,
    `Formato de saída: ${formatLabel(c.format)}.`,
    c.audience && `Público: ${c.audience}.`,
    `Tom: ${toneLabel(c.tone)}.`,
    c.limit && `Limite: ${c.limit}.`,
    c.restrictions?.length && `Restrições: ${c.restrictions.join(', ')}.`,
    c.fewShot && `Exemplo de linha: "${c.fewShot.output}"`,
    c.chainOfThought && 'Antes de gerar a saída, liste os critérios considerados e justifique a inclusão de cada um.',
  ].filter(Boolean).join('\n'),

  marketing: (c) => [
    `Crie ${c.action} para ${c.theme}.`,
    c.audience && `Público-alvo: ${c.audience}.`,
    c.objective && `Objetivo: ${c.objective}.`,
    `Tom: ${toneLabel(c.tone)}.`,
    c.limit && `Formato: ${c.limit}.`,
    c.restrictions?.length && `Evitar: ${c.restrictions.join(', ')}.`,
  ].filter(Boolean).join('\n'),

  brainstorming: (c) => [
    `Gere ${c.action} no nicho de ${c.theme}.`,
    c.objective && `Cada ideia deve conter: ${c.objective}.`,
    c.restrictions?.length && `Restrições: ${c.restrictions.join(', ')}.`,
    c.fewShot && `Exemplo de formato:\n"${c.fewShot.output}"`,
    c.chainOfThought && 'Para cada ideia, explique o raciocínio por trás do diferencial de mercado.',
  ].filter(Boolean).join('\n'),
};

export default TEMPLATES;
