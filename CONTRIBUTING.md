# Contribuindo com o Prompt Generator

Obrigado pelo interesse em contribuir! Este documento explica como participar do projeto.

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- (Opcional) Ollama para testes locais com IA

## Setup

```bash
git clone https://github.com/REDSEC90/prompt-generator.git
cd prompt-generator
npm install
cp .env.example .env
```

## Rodando os testes

```bash
npm test              # todos os testes
npm test -- --coverage  # com cobertura
```

Cobertura mínima esperada: **90% statements**.

## Estrutura do projeto

```
src/
  core/       # lógica de negócio (sem dependência de CLI)
  cli/        # interface de linha de comando
  index.ts    # orquestrador principal
tests/        # testes unitários (Jest + ts-jest)
training/     # scripts de fine-tuning (Python)
docs/         # documentação
```

## Fluxo de contribuição

1. Abra uma issue descrevendo o problema ou feature
2. Fork o repositório
3. Crie uma branch: `git checkout -b feat/minha-feature`
4. Implemente com testes
5. `npm test` deve passar sem erros
6. Abra um Pull Request para `main`

## Convenções

- **Commits**: use prefixos `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`
- **TypeScript**: sem `any` explícito; use tipos estritos
- **Testes**: cada novo módulo em `src/core/` deve ter arquivo de teste correspondente
- **Docs**: atualize `docs/referencia-tecnica.md` se alterar comportamento de API pública

## Áreas que precisam de contribuição

- [ ] Interface web (ver roadmap em `README.md`)
- [ ] Novos providers de IA (Gemini, Mistral API)
- [ ] Novas categorias de prompt
- [ ] Internacionalização (i18n)
- [ ] Plugin para VS Code

## Código de conduta

Seja respeitoso. Críticas são bem-vindas; ataques pessoais, não.
