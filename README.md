# Prompt Generator

CLI interativa para criar, revisar e executar prompts estruturados para LLMs como ChatGPT, Claude e Gemini.

## Uso Imediato

```bash
npm install
npm start
```

Se for sua primeira vez, siga [docs/inicio-rapido.md](/home/redsec/Ambiente/prompt-generator/docs/inicio-rapido.md).

## O Que o Programa Faz

- guia o preenchimento do prompt por wizard;
- permite uso total por flags;
- suporta modo híbrido;
- gera 3 variações de prompt;
- pode enviar para Anthropic ou OpenAI;
- pode rodar em modo offline;
- exporta prompt e resposta para Markdown.

## Exemplo Rápido

```bash
npm start -- \
  --theme "JWT no Express" \
  --action "escreva" \
  --category code \
  --audience "dev backend" \
  --objective "validar token em rotas protegidas" \
  --tone technical \
  --format code \
  --language TypeScript
```

## Trilhas de Leitura

### Iniciante

- [Início Rápido](/home/redsec/Ambiente/prompt-generator/docs/inicio-rapido.md)

### Uso do dia a dia

- [Guia Básico](/home/redsec/Ambiente/prompt-generator/docs/guia-basico.md)

### Uso completo

- [Guia Avançado](/home/redsec/Ambiente/prompt-generator/docs/guia-avancado.md)

### Receitas prontas

- [Exemplos Práticos](/home/redsec/Ambiente/prompt-generator/docs/exemplos-praticos.md)

### Consulta rápida

- [Cheatsheet](/home/redsec/Ambiente/prompt-generator/docs/CHEATSHEET.md)

### Referência técnica

- [Referência Técnica](/home/redsec/Ambiente/prompt-generator/docs/referencia-tecnica.md)

## Categorias Suportadas

| Categoria | Uso |
|---|---|
| Resumo | Síntese de conteúdo |
| Código | Geração de scripts e funções |
| Análise | Comparações e avaliações |
| Marketing | Copywriting e campanhas |
| Brainstorming | Geração de ideias |
| Tradução | Tradução contextualizada |
| Q&A | Perguntas e respostas |
| Criativo | Escrita criativa |

## Configuração de Ambiente

```bash
cp .env.example .env
```

Sem `AI_API_KEY`, o sistema funciona em modo offline.
# prompt-generator
