# Plano de Melhoria da Documentação — Prompt Generator

**Data:** 2026-04-27  
**Objetivo:** Transformar a documentação atual em uma trilha de aprendizagem progressiva que ensine usuários novos a usar o programa de forma básica até avançada, sem inconsistências.

---

## Diagnóstico Atual

### O que está funcionando

✅ **guia-de-uso.md** é completo e cobre praticamente todas as funcionalidades  
✅ **README.md** é um bom ponto de entrada curto  
✅ Há exemplos práticos de uso por categoria e modo  
✅ Distinção entre modo interativo, flags e híbrido está bem explicada no guia  

### Problemas críticos identificados

❌ **Inconsistências entre documentos** — informações conflitantes entre README, funcionalidades.md, .env.example e guia-de-uso.md  
❌ **Documentação técnica desatualizada** — funcionalidades.md contradiz o comportamento real do código  
❌ **Falta hierarquia de leitura** — não há trilha clara de "comece aqui" → "primeiro uso" → "referência completa"  
❌ **guia-de-uso.md muito denso** — mistura manual prático com detalhes internos, dificulta primeira leitura  
❌ **.env.example desatualizado** — valores conflitam com documentação principal  

### Inconsistências específicas encontradas

| Documento | Linha/Seção | Problema | Impacto |
|---|---|---|---|
| `funcionalidades.md:21` | Validação | Diz que retorna `valid: false`, mas comportamento real é warning não bloqueante | Alto — desinforma sobre comportamento |
| `funcionalidades.md:109` | Categorias | Lista só 5 categorias, código atual tem 8 | Alto — usuário não descobre funcionalidades |
| `funcionalidades.md:118` | Wizard | Diz 9 perguntas, wizard atual tem 12 etapas | Médio — expectativa errada |
| `funcionalidades.md:148` | Tokens | Documenta `AI_MAX_TOKENS=2000`, código usa 4000 | Médio — configuração inconsistente |
| `.env.example:5` | Tokens | Mostra 2000, guia ensina 4000 | Alto — primeiro passo já inconsistente |
| `README.md:61` | Referências | Manda para funcionalidades.md defasado | Médio — reduz confiança |

---

## Proposta de Reestruturação

### Nova hierarquia de documentação

```
README.md
├─ Início rápido (5 minutos)
├─ Primeiro uso guiado
└─ Links para documentação completa

docs/
├─ inicio-rapido.md          [NOVO] — Onboarding em 5 minutos
├─ guia-basico.md            [NOVO] — Uso essencial para iniciantes
├─ guia-avancado.md          [REFATORADO] — Uso completo e casos complexos
├─ referencia-tecnica.md     [RENOMEADO] — funcionalidades.md atualizado
└─ exemplos-praticos.md      [NOVO] — Receitas prontas por caso de uso
```

---

## Melhorias Detalhadas por Documento

### 1. README.md — Porta de Entrada

**Status atual:** Bom ponto de entrada, mas não ensina uso real  
**Objetivo:** Transformar em trilha de onboarding clara

#### Melhorias necessárias

**1.1. Adicionar seção "Primeiro Uso em 5 Minutos"**

```markdown
## Primeiro Uso em 5 Minutos

1. Clone e instale:
   ```bash
   git clone <repo>
   cd prompt-generator
   npm install
   ```

2. Execute o wizard interativo:
   ```bash
   npm start
   ```

3. Responda as perguntas básicas (tema, ação, categoria)

4. Escolha uma das 3 variações geradas

5. Veja o prompt gerado (ou envie para IA se configurou API)

✅ Pronto! Você acabou de criar seu primeiro prompt estruturado.
```

**1.2. Adicionar mapa de aprendizagem**

```markdown
## Como Aprender a Usar

### Iniciante (nunca usei)
👉 Comece por: `docs/inicio-rapido.md`  
⏱️ Tempo: 10 minutos  
🎯 Você vai aprender: instalar, executar wizard, entender categorias básicas

### Usuário básico (já usei algumas vezes)
👉 Leia: `docs/guia-basico.md`  
⏱️ Tempo: 20 minutos  
🎯 Você vai aprender: usar flags, modo híbrido, escolher variações, exportar

### Usuário avançado (quero dominar o programa)
👉 Estude: `docs/guia-avancado.md`  
⏱️ Tempo: 45 minutos  
🎯 Você vai aprender: todas as 8 categorias, few-shot, restrições, automação

### Desenvolvedor (quero entender internamente)
👉 Consulte: `docs/referencia-tecnica.md`  
🎯 Arquitetura, tipos, templates, decisões de design
```

**1.3. Corrigir tabela de categorias**

Adicionar as 3 categorias faltantes:

```markdown
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
```

**1.4. Atualizar seção de documentação**

```markdown
## Documentação

- **[Início Rápido](docs/inicio-rapido.md)** — Primeiro uso em 10 minutos
- **[Guia Básico](docs/guia-basico.md)** — Uso essencial para o dia a dia
- **[Guia Avançado](docs/guia-avancado.md)** — Uso completo e casos complexos
- **[Referência Técnica](docs/referencia-tecnica.md)** — Arquitetura e detalhes internos
- **[Exemplos Práticos](docs/exemplos-praticos.md)** — Receitas prontas por caso de uso
```

---

### 2. docs/inicio-rapido.md [NOVO]

**Objetivo:** Ensinar o essencial em 10 minutos para usuário completamente novo

#### Estrutura proposta

```markdown
# Início Rápido — Prompt Generator

Aprenda o essencial em 10 minutos.

## O que este programa faz?

Cria prompts estruturados para IAs como ChatGPT e Claude.

Ao invés de escrever prompts manualmente, você responde perguntas e o programa monta o prompt otimizado para você.

## Instalação

[instruções mínimas]

## Seu Primeiro Prompt

### Passo 1: Execute o wizard

```bash
npm start
```

### Passo 2: Responda as perguntas essenciais

[screenshot ou exemplo de interação]

### Passo 3: Escolha uma variação

O programa gera 3 versões:
- **Direta** — rápida e simples
- **Contextualizada** — equilibrada (recomendada)
- **Chain-of-Thought** — detalhada com raciocínio

### Passo 4: Veja o resultado

[exemplo de prompt gerado]

## Próximos Passos

✅ Você já sabe usar o básico!

Agora você pode:
- Ler o [Guia Básico](guia-basico.md) para aprender flags e modo híbrido
- Ver [Exemplos Práticos](exemplos-praticos.md) para casos reais
- Configurar integração com IA (opcional)
```

---

### 3. docs/guia-basico.md [NOVO]

**Objetivo:** Ensinar uso essencial para o dia a dia (flags, híbrido, exportação)

#### Estrutura proposta

```markdown
# Guia Básico — Prompt Generator

Para quem já usou o wizard e quer aprender mais.

## Índice

1. Três modos de uso
2. Uso por flags (automação)
3. Uso híbrido (melhor dos dois mundos)
4. Como escolher a variação certa
5. Integração com IA
6. Exportação de prompts
7. Receitas básicas

## 1. Três Modos de Uso

[explicação clara e concisa]

## 2. Uso Por Flags

### Campos obrigatórios

[lista mínima]

### Exemplo completo

[comando real comentado]

## 3. Uso Híbrido

[explicação + exemplo prático]

## 4. Como Escolher a Variação Certa

| Variação | Quando usar | Exemplo |
|---|---|---|
| 1 — Direta | Iteração rápida, testes | Exploração inicial |
| 2 — Contextualizada | Uso geral, produção | Maioria dos casos |
| 3 — Chain-of-Thought | Análise, decisões | Comparações técnicas |

## 5. Integração com IA

[configuração .env + exemplo]

## 6. Exportação

[como exportar + estrutura do arquivo]

## 7. Receitas Básicas

### Gerar código TypeScript
[comando completo]

### Criar resumo técnico
[comando completo]

### Comparar tecnologias
[comando completo]
```

---

### 4. docs/guia-avancado.md [REFATORADO]

**Objetivo:** Refatorar guia-de-uso.md atual em versão focada em uso avançado

#### Mudanças necessárias

**4.1. Remover seções básicas** (mover para guia-basico.md)
- Instalação básica
- Primeiro uso
- Explicação de modos

**4.2. Focar em uso complexo**
- Todas as 8 categorias com exemplos completos
- Few-shot detalhado
- Restrições avançadas
- Combinações de tons e formatos
- Warnings de compatibilidade
- Automação com scripts

**4.3. Adicionar seção "Casos de Uso Complexos"**
- Tradução técnica com terminologia específica
- Marketing com múltiplas restrições de estilo
- Código com few-shot e restrições de libs
- Brainstorming estruturado com CoT

**4.4. Manter seções técnicas**
- Todos os campos do PromptConfig
- Todas as categorias
- Todas as variações
- Tons e formatos
- Limites atuais

---

### 5. docs/referencia-tecnica.md [RENOMEADO + ATUALIZADO]

**Objetivo:** Atualizar funcionalidades.md para refletir código real

#### Correções obrigatórias

**5.1. Corrigir comportamento de validação**

❌ **Atual:**
```markdown
Retorna `valid: false` e lista de avisos quando há conflito.
```

✅ **Correto:**
```markdown
Retorna warnings não bloqueantes. A execução continua mesmo com incompatibilidades.
```

**5.2. Atualizar lista de categorias**

❌ **Atual:** 5 categorias  
✅ **Correto:** 8 categorias (summary, code, analysis, marketing, brainstorming, translation, qa, creative)

**5.3. Corrigir número de perguntas do wizard**

❌ **Atual:** 9 perguntas  
✅ **Correto:** 12 etapas (incluindo opcionais)

**5.4. Atualizar AI_MAX_TOKENS**

❌ **Atual:** 2000  
✅ **Correto:** 4000

**5.5. Adicionar categorias faltantes**

Documentar templates de:
- `translation`
- `qa`
- `creative`

**5.6. Atualizar seção de variações**

Corrigir comportamento da variação direta:
- Remove `restrictions`
- Remove `fewShot`
- Desliga `chainOfThought`
- Filtra placeholder `-`

---

### 6. docs/exemplos-praticos.md [NOVO]

**Objetivo:** Receitas prontas para copiar e adaptar

#### Estrutura proposta

```markdown
# Exemplos Práticos — Prompt Generator

Receitas prontas para casos reais. Copie, adapte e use.

## Índice por Caso de Uso

### Desenvolvimento
- Gerar middleware Express com TypeScript
- Criar testes unitários
- Documentar API REST
- Refatorar código legado

### Documentação
- Criar guia de onboarding
- Gerar FAQ técnico
- Resumir arquitetura
- Traduzir documentação

### Análise
- Comparar tecnologias
- Avaliar tradeoffs
- Benchmark conceitual
- Análise de requisitos

### Marketing
- Copy de landing page
- E-mail de prospecção
- Post para redes sociais
- Campanha de lançamento

### Brainstorming
- Nomes de produto
- Features de roadmap
- Ideias de conteúdo
- Posicionamento de marca

## Formato de Cada Receita

### [Nome do Caso de Uso]

**Contexto:** [quando usar]

**Comando completo:**
```bash
[comando pronto para copiar]
```

**Resultado esperado:**
[exemplo de saída]

**Variações úteis:**
[adaptações comuns]
```

---

### 7. .env.example [CORREÇÃO]

**Objetivo:** Alinhar com documentação e código

#### Correções necessárias

❌ **Atual:**
```env
AI_MAX_TOKENS=2000
```

✅ **Correto:**
```env
AI_MAX_TOKENS=4000
```

**Adicionar comentários explicativos:**

```env
# Provider de IA (obrigatório para enviar prompts)
# Valores aceitos: anthropic | openai
AI_PROVIDER=anthropic

# Chave de autenticação da API
# Sem esta chave, o sistema roda em modo offline (apenas gera o prompt)
AI_API_KEY=sk-...

# Modelo específico do provider
# Anthropic: claude-sonnet-4-5, claude-opus-4
# OpenAI: gpt-4o, gpt-4-turbo
AI_MODEL=claude-sonnet-4-5

# Limite de tokens na resposta (aplicado ao fluxo Anthropic)
# Padrão: 4000
AI_MAX_TOKENS=4000
```

---

## Priorização de Implementação

### Fase 1: Correções Críticas (impacto imediato)

1. ✅ Corrigir `.env.example` (5 min)
2. ✅ Atualizar `funcionalidades.md` → `referencia-tecnica.md` (30 min)
3. ✅ Adicionar categorias faltantes no README (5 min)

### Fase 2: Onboarding Básico (usuários novos)

4. ✅ Criar `docs/inicio-rapido.md` (45 min)
5. ✅ Atualizar README com mapa de aprendizagem (20 min)
6. ✅ Criar `docs/guia-basico.md` (60 min)

### Fase 3: Uso Avançado (usuários experientes)

7. ✅ Refatorar `guia-de-uso.md` → `guia-avancado.md` (45 min)
8. ✅ Criar `docs/exemplos-praticos.md` (60 min)

### Fase 4: Polimento (qualidade final)

9. ✅ Revisar consistência entre todos os documentos (30 min)
10. ✅ Adicionar screenshots/exemplos visuais (opcional, 60 min)
11. ✅ Criar índice geral de navegação (15 min)

**Tempo total estimado:** 5-6 horas

---

## Métricas de Sucesso

### Como saber se a documentação melhorou?

✅ **Usuário novo consegue gerar primeiro prompt em < 10 minutos**  
✅ **Não há informações conflitantes entre documentos**  
✅ **Cada nível de experiência tem trilha clara de aprendizagem**  
✅ **Exemplos práticos cobrem casos reais de uso**  
✅ **Documentação técnica reflete comportamento real do código**  

### Teste prático

Pedir para alguém que nunca usou o programa:

1. Ler apenas `README.md` + `docs/inicio-rapido.md`
2. Executar primeiro prompt sem ajuda externa
3. Responder: "você conseguiu? o que faltou?"

Se a resposta for "sim, consegui", a documentação está boa.

---

## Próximos Passos

1. Revisar e aprovar este plano
2. Implementar Fase 1 (correções críticas)
3. Implementar Fase 2 (onboarding básico)
4. Testar com usuário novo real
5. Ajustar baseado no feedback
6. Implementar Fases 3 e 4

---

**Autor:** Análise realizada em 2026-04-27  
**Revisão:** Pendente
