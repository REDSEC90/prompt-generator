# Cheatsheet

Consulta rápida para quem já usa o programa.

## Comando mínimo

```bash
npm start -- \
  --theme "X" \
  --action "Y" \
  --category Z \
  --audience "A" \
  --objective "O" \
  --tone T \
  --format F
```

## Categorias

```text
summary
code
analysis
marketing
brainstorming
translation
qa
creative
```

## Tons

```text
formal
friendly
persuasive
didactic
journalistic
technical
```

## Formatos

```text
markdown
json
table
numbered-list
prose
html
code
```

## Variações

```text
1 = direta
2 = contextualizada
3 = chain-of-thought
```

## Flags úteis

```text
--language
--limit
--restrictions
--few-shot-input
--few-shot-output
--variation
--interactive
--no-send
--export
```

## Modos

```bash
# Wizard
npm start

# Híbrido
npm start -- --theme "X"

# Flags
npm start -- [flags]
```

## Offline

```text
--no-send
```

ou sem `AI_API_KEY`.

## Exportação

```text
--export
```

## Ver mais

- [Início Rápido](inicio-rapido.md)
- [Guia Básico](guia-basico.md)
- [Guia Avançado](guia-avancado.md)
