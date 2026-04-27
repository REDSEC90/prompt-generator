# 🚀 Início Rápido

> ⏱️ **Leitura:** 8 minutos  
> 🎯 **Para:** Quem nunca usou o programa

---

## 📖 Objetivo

Ao final deste guia você vai conseguir:

- ✅ Instalar o projeto
- ✅ Rodar o wizard
- ✅ Preencher os campos principais
- ✅ Escolher uma variação
- ✅ Gerar um prompt mesmo sem API configurada

---

## 1️⃣ Instalar

```bash
npm install
```

---

## 2️⃣ Rodar o wizard

```bash
npm start
```

---

## 3️⃣ Preencher os 7 campos principais

Na primeira execução, foque apenas nestes campos:

| Campo | O que é |
|-------|---------|
| `theme` | 📌 Sobre o que é a tarefa |
| `action` | ⚡ O que a IA deve fazer |
| `category` | 📦 Tipo de tarefa |
| `audience` | 👥 Para quem a resposta serve |
| `objective` | 🎯 Qual resultado você quer |
| `tone` | 🎨 Estilo da resposta |
| `format` | 📄 Forma de entrega |

### 💡 Exemplo Prático

```text
theme: middleware de autenticação JWT
action: escreva
category: code
audience: dev backend Node.js
objective: validar token em rotas protegidas do Express
tone: technical
format: code
```

---

## 4️⃣ Revisar antes de continuar

O wizard mostra um **resumo da configuração**.

Você pode:

- ✅ Continuar
- ✏️ Editar um campo
- 🔄 Recomeçar
- ❌ Cancelar

> **💡 Dica:**  
> • Se o prompt parecer genérico → ajuste `objective`  
> • Se o nível técnico parecer errado → ajuste `audience`

---

## 5️⃣ Escolher a variação

O programa gera **3 versões**:

| # | Nome | Quando usar |
|---|------|-------------|
| **1** | Direta | ⚡ Teste rápido e exploração |
| **2** | Contextualizada | ⭐ **Melhor escolha padrão** |
| **3** | Chain-of-Thought | 🧠 Análise, comparação, justificativa |

> **💡 Primeira vez?** Escolha **2**.

---

## 6️⃣ Ver o resultado

### 🔌 Se você não configurou API

- ✅ Sistema entra em modo offline
- ✅ Mostra o prompt no terminal
- ❌ Não faz chamada externa

### 🌐 Se você configurou API

- ✅ Sistema envia o prompt
- ✅ Mostra a resposta em streaming
- ✅ Oferece exportação ao final

## Exemplo de primeira execução

```bash
npm start -- \
  --theme "middleware de autenticação JWT" \
  --action "escreva" \
  --category code \
  --audience "dev backend Node.js" \
  --objective "validar token em rotas protegidas do Express" \
  --tone technical \
  --format code \
  --no-send
```

Use `--no-send` na primeira vez se quiser apenas inspecionar o prompt.

## Problemas comuns

### O prompt saiu genérico

Melhore:

- `theme`
- `objective`
- `audience`

### Nada foi enviado para a IA

Verifique:

- se `AI_API_KEY` está no `.env`;
- se você não usou `--no-send`.

### Apareceu warning de compatibilidade

Isso não bloqueia a execução.

Só significa que a combinação escolhida tende a dar resultado ruim.

Exemplos:

- `marketing + json`
- `marketing + table`
- `summary + code`

## Próximo passo

Siga para [Guia Básico](guia-basico.md).
