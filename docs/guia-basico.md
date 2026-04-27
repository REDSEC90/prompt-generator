# Guia Básico

Leitura estimada: 15 minutos.

Este guia é para quem já rodou o wizard e agora quer usar o programa com mais controle.

## O que você vai aprender

- diferença entre modo interativo, flags e híbrido;
- como montar comandos por flags;
- quando usar cada variação;
- como usar modo offline;
- como exportar resultados;
- quais opcionais mais ajudam no dia a dia.

## Modos de uso

### Modo interativo

```bash
npm start
```

Use quando:

- está explorando;
- quer ajuda para preencher;
- quer revisar tudo antes de gerar.

### Modo por flags

```bash
npm start -- [flags]
```

Use quando:

- quer repetição;
- quer automação;
- já sabe exatamente o que precisa.

### Modo híbrido

```bash
npm start -- --theme "JWT no Express"
```

Use quando:

- quer ganhar tempo;
- quer pré-preencher parte da configuração;
- ainda quer revisar o resto no wizard.

## Flags obrigatórias

Para execução totalmente não interativa, preencha:

- `--theme`
- `--action`
- `--category`
- `--audience`
- `--objective`
- `--tone`
- `--format`

Exemplo mínimo:

```bash
npm start -- \
  --theme "comparação entre React e Vue" \
  --action "analise" \
  --category analysis \
  --audience "time de arquitetura" \
  --objective "escolha para novo produto interno" \
  --tone technical \
  --format table
```

## Flags opcionais mais úteis

### `--language`

Use em:

- `code`: linguagem de programação
- `translation`: idioma de destino

### `--limit`

Exemplos:

- `200 palavras`
- `10 ideias`
- `até 5 perguntas`

### `--restrictions`

Exemplo:

```bash
--restrictions "sem jargão,sem libs externas"
```

### `--few-shot-input` e `--few-shot-output`

Use quando quiser demonstrar formato ou estilo por exemplo.

## Uso híbrido na prática

### Exemplo 1

```bash
npm start -- \
  --theme "documentação de onboarding" \
  --category summary
```

### Exemplo 2

```bash
npm start -- \
  --theme "React Server Components" \
  --category summary \
  --tone didactic
```

### Exemplo 3: forçar revisão

```bash
npm start -- \
  --theme "JWT no Express" \
  --action "escreva" \
  --category code \
  --audience "dev backend" \
  --objective "validar token" \
  --tone technical \
  --format code \
  --interactive
```

## Como escolher a variação

- `1` Direta: iteração rápida
- `2` Contextualizada: uso geral
- `3` Chain-of-Thought: análise e justificativa

Regra prática:

- escolha `2` por padrão;
- use `1` para explorar;
- use `3` quando critérios e raciocínio importam.

## Integração com IA

Copie o exemplo:

```bash
cp .env.example .env
```

Exemplo de configuração:

```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-...
AI_MODEL=claude-sonnet-4-5
AI_MAX_TOKENS=4000
```

## Modo offline

Você pode usar o programa sem API de duas formas.

### Sem `AI_API_KEY`

O sistema já entra em modo offline.

### Com `--no-send`

```bash
npm start -- \
  --theme "guia de arquitetura" \
  --action "resuma" \
  --category summary \
  --audience "time de engenharia" \
  --objective "alinhamento inicial" \
  --tone formal \
  --format markdown \
  --no-send
```

## Exportação

### Manual

Ao final da resposta, o programa pergunta se deve exportar.

### Automática

```bash
--export
```

Exemplo:

```bash
npm start -- \
  --theme "FAQ de deploy" \
  --action "gere perguntas e respostas frequentes" \
  --category qa \
  --audience "novos desenvolvedores" \
  --objective "explicar o fluxo padrão" \
  --tone didactic \
  --format markdown \
  --variation 2 \
  --export
```

## Receitas do dia a dia

### Gerar código TypeScript

```bash
npm start -- \
  --theme "middleware JWT" \
  --action "escreva" \
  --category code \
  --audience "dev backend" \
  --objective "proteger rotas Express" \
  --tone technical \
  --format code \
  --language TypeScript
```

### Criar resumo técnico

```bash
npm start -- \
  --theme "arquitetura de microsserviços" \
  --action "resuma" \
  --category summary \
  --audience "liderança técnica" \
  --objective "explicar vantagens e riscos" \
  --tone formal \
  --format markdown
```

### Comparar tecnologias

```bash
npm start -- \
  --theme "PostgreSQL vs MongoDB" \
  --action "compare" \
  --category analysis \
  --audience "arquitetos de software" \
  --objective "escolha para e-commerce" \
  --tone technical \
  --format table \
  --variation 3
```

## Troubleshooting básico

### Nada foi enviado para a IA

Cheque:

- `AI_API_KEY`
- `AI_PROVIDER`
- se você passou `--no-send`

### Recebi warning de incompatibilidade

Não é erro fatal.

Tente combinar melhor categoria e formato.

### A resposta ficou ruim

Revise:

- `theme`
- `objective`
- `audience`
- categoria
- variação

## Próximo passo

Siga para [Guia Avançado](guia-avancado.md).
