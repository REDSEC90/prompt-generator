# Índice Geral da Documentação — Prompt Generator

Navegação completa da documentação do projeto.

## Para Usuários

### 🚀 Começando

**[Início Rápido](inicio-rapido.md)** — 10 minutos  
Primeiro uso, instalação, wizard básico, configuração opcional de IA.

**[Guia Básico](guia-basico.md)** — 20 minutos  
Três modos de uso, flags, modo híbrido, variações, integração com IA, exportação.

**[Guia Avançado](guia-avancado.md)** — 45 minutos  
Todos os campos, todas as 8 categorias, variações em profundidade, tons e formatos, few-shot, restrições, warnings, automação, casos complexos.

**[Exemplos Práticos](exemplos-praticos.md)** — Referência  
Receitas prontas para desenvolvimento, documentação, análise, marketing e brainstorming.

---

## Para Desenvolvedores

**[Referência Técnica](referencia-tecnica.md)**  
Arquitetura, módulos, tipos, templates, decisões de design, variáveis de ambiente.

---

## Trilhas de Aprendizagem

### 👶 Nunca usei
1. [Início Rápido](inicio-rapido.md)
2. Pratique com o wizard
3. [Guia Básico](guia-basico.md) quando se sentir confortável

### 📚 Já usei algumas vezes
1. [Guia Básico](guia-basico.md)
2. [Exemplos Práticos](exemplos-praticos.md) para casos específicos
3. [Guia Avançado](guia-avancado.md) quando quiser dominar

### 🚀 Quero dominar completamente
1. [Guia Avançado](guia-avancado.md)
2. [Exemplos Práticos](exemplos-praticos.md) para referência
3. [Referência Técnica](referencia-tecnica.md) para entender internamente

### 🔧 Quero contribuir com o projeto
1. [Referência Técnica](referencia-tecnica.md)
2. Código-fonte em `/src`
3. Testes em `/tests`

---

## Busca Rápida

### Por Funcionalidade

| Funcionalidade | Documento |
|---|---|
| Instalação | [Início Rápido](inicio-rapido.md#instalação) |
| Primeiro uso | [Início Rápido](inicio-rapido.md#seu-primeiro-prompt) |
| Uso por flags | [Guia Básico](guia-basico.md#2-uso-por-flags-automação) |
| Modo híbrido | [Guia Básico](guia-basico.md#3-uso-híbrido-melhor-dos-dois-mundos) |
| Variações | [Guia Básico](guia-basico.md#4-como-escolher-a-variação-certa) |
| Integração com IA | [Guia Básico](guia-basico.md#5-integração-com-ia) |
| Exportação | [Guia Básico](guia-basico.md#6-exportação-de-prompts) |
| Todas as categorias | [Guia Avançado](guia-avancado.md#2-todas-as-8-categorias) |
| Few-shot | [Guia Avançado](guia-avancado.md#5-few-shot-avançado) |
| Restrições | [Guia Avançado](guia-avancado.md#6-restrições-complexas) |
| Automação | [Guia Avançado](guia-avancado.md#8-automação-com-scripts) |
| Receitas prontas | [Exemplos Práticos](exemplos-praticos.md) |
| Arquitetura | [Referência Técnica](referencia-tecnica.md) |

### Por Categoria

| Categoria | Guia Avançado | Exemplos Práticos |
|---|---|---|
| `summary` | [Link](guia-avancado.md#21-summary--síntese-e-resumo) | [Documentação](exemplos-praticos.md#documentação) |
| `code` | [Link](guia-avancado.md#22-code--geração-de-código) | [Desenvolvimento](exemplos-praticos.md#desenvolvimento) |
| `analysis` | [Link](guia-avancado.md#23-analysis--comparação-e-avaliação) | [Análise](exemplos-praticos.md#análise) |
| `marketing` | [Link](guia-avancado.md#24-marketing--conteúdo-persuasivo) | [Marketing](exemplos-praticos.md#marketing) |
| `brainstorming` | [Link](guia-avancado.md#25-brainstorming--geração-de-ideias) | [Brainstorming](exemplos-praticos.md#brainstorming) |
| `translation` | [Link](guia-avancado.md#26-translation--tradução-contextualizada) | [Tradução](exemplos-praticos.md#traduzir-documentação-técnica) |
| `qa` | [Link](guia-avancado.md#27-qa--perguntas-e-respostas) | [FAQ](exemplos-praticos.md#gerar-faq-técnico) |
| `creative` | [Link](guia-avancado.md#28-creative--escrita-criativa) | — |

---

## Estrutura dos Documentos

```
docs/
├── INDICE.md                    [este arquivo]
├── inicio-rapido.md             Onboarding em 10 minutos
├── guia-basico.md               Uso essencial para o dia a dia
├── guia-avancado.md             Uso completo e casos complexos
├── exemplos-praticos.md         Receitas prontas por caso de uso
├── referencia-tecnica.md        Arquitetura e detalhes internos
└── plano-melhoria-documentacao.md  Histórico de melhorias
```

---

## Contribuindo com a Documentação

Encontrou algo errado ou que pode melhorar?

1. Abra uma issue descrevendo o problema
2. Ou envie um PR com a correção
3. Mantenha o tom direto e prático
4. Inclua exemplos quando relevante

---

## Changelog da Documentação

### 2026-04-27 — Reestruturação Completa

- ✅ Criada hierarquia de aprendizagem progressiva
- ✅ Corrigidas inconsistências entre documentos
- ✅ Atualizado `.env.example` (2000 → 4000 tokens)
- ✅ Renomeado `funcionalidades.md` → `referencia-tecnica.md`
- ✅ Adicionadas 3 categorias faltantes (translation, qa, creative)
- ✅ Criados 4 novos documentos de onboarding
- ✅ Adicionado mapa de aprendizagem ao README

Ver [plano-melhoria-documentacao.md](plano-melhoria-documentacao.md) para detalhes completos.

---

**Última atualização:** 2026-04-27
