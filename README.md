# Gerador de Prompts Inteligente

CLI interativo que transforma uma ideia simples em prompts estruturados e eficientes para LLMs (ChatGPT, Claude, Gemini).

## Instalação

```bash
npm install
```

## Uso

```bash
# Com API configurada
cp .env.example .env   # preencha AI_API_KEY
npm start

# Modo offline (gera o prompt sem enviar à API)
npm start
```

## Fluxo

1. Responda as perguntas guiadas (tema, categoria, público, tom, formato)
2. Escolha entre 3 variações geradas: **direta**, **contextualizada** ou **chain-of-thought**
3. O prompt é enviado à API e a resposta aparece em streaming

## Categorias suportadas

| Categoria | Uso |
|---|---|
| Resumo | Síntese de conteúdo |
| Código | Geração de scripts e funções |
| Análise | Comparações e avaliações |
| Marketing | Copywriting e campanhas |
| Brainstorming | Geração de ideias |

## Variáveis de ambiente

Veja `.env.example`. Sem `AI_API_KEY`, o sistema roda em modo offline e exibe o prompt gerado.

## Documentação

Ver pasta `docs/` para os fundamentos, categorias, template modular, arquitetura e melhores práticas.
