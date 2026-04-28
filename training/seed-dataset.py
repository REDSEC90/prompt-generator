"""
Gera um dataset.jsonl sintético para bootstrap do fine-tuning,
sem depender de histórico acumulado pelo usuário.

Uso:
  python training/seed-dataset.py [--output dataset.jsonl] [--min 50]
"""
import argparse
import json
import random
from pathlib import Path

EXAMPLES = [
    # (instruction, output)
    (
        "Criar um endpoint REST em Node.js com autenticação JWT",
        """Você é um engenheiro backend sênior especializado em Node.js e segurança de APIs.

Tarefa: Implemente um endpoint REST POST /auth/login que:
1. Receba { email, password } no body
2. Valide as credenciais contra o banco de dados
3. Retorne um JWT assinado com expiração de 1h em caso de sucesso
4. Retorne HTTP 401 com mensagem clara em caso de falha

Formato de saída: código TypeScript completo com Express, comentários inline e tratamento de erros.
Restrições: use bcrypt para comparação de senha; nunca exponha o hash no response.
Critério de qualidade: o código deve compilar sem erros e cobrir os casos de sucesso e falha.""",
    ),
    (
        "Resumir artigo técnico sobre microserviços para desenvolvedores júnior",
        """Você é um tech writer especializado em tornar conceitos complexos acessíveis.

Tarefa: Leia o artigo técnico fornecido sobre microserviços e produza um resumo para desenvolvedores com menos de 2 anos de experiência.

Formato de saída: Markdown com as seções:
- **O que são microserviços** (2-3 frases)
- **Vantagens principais** (lista com 3 itens)
- **Desafios comuns** (lista com 3 itens)
- **Quando usar** (1 parágrafo)

Restrições: evite jargões sem explicação; use analogias do mundo real; máximo 400 palavras.
Critério de qualidade: um dev júnior deve conseguir explicar o conceito após ler o resumo.""",
    ),
    (
        "Escrever copy de email marketing para lançamento de curso online",
        """Você é um copywriter especializado em marketing digital e cursos online.

Tarefa: Escreva um email de lançamento para um curso de programação Python do zero, com foco em conversão.

Formato de saída:
- Assunto do email (máximo 60 caracteres, com emoji)
- Corpo do email com: gancho emocional, proposta de valor, 3 benefícios concretos, prova social, CTA claro
- PS com urgência (vagas limitadas ou desconto por tempo)

Restrições: tom amigável e motivador; sem promessas irreais; máximo 300 palavras no corpo.
Critério de qualidade: taxa de abertura estimada > 25% e CTA claro e único.""",
    ),
    (
        "Gerar 10 ideias de negócio no nicho de SaaS para pequenas empresas",
        """Você é um empreendedor serial com experiência em SaaS B2B para PMEs.

Tarefa: Gere 10 ideias de negócio SaaS voltadas para pequenas empresas (1-50 funcionários) com potencial de receita recorrente.

Formato de saída: tabela Markdown com colunas:
| # | Nome | Problema que resolve | Público-alvo | MRR estimado (R$) | Complexidade técnica |

Restrições: foque em problemas reais e validados; evite ideias já saturadas; priorize nichos brasileiros.
Critério de qualidade: cada ideia deve ter um problema claramente definido e público-alvo específico.""",
    ),
    (
        "Traduzir documentação técnica de inglês para português mantendo termos técnicos",
        """Você é um tradutor técnico especializado em documentação de software.

Tarefa: Traduza a documentação técnica fornecida do inglês para o português brasileiro.

Formato de saída: Markdown preservando toda a formatação original (headers, code blocks, listas, tabelas).

Restrições:
- Mantenha termos técnicos em inglês quando não houver equivalente consagrado em PT-BR (ex: deploy, commit, branch)
- Adicione nota de rodapé na primeira ocorrência de cada termo técnico mantido em inglês
- Preserve todos os exemplos de código sem tradução

Critério de qualidade: um desenvolvedor brasileiro deve preferir esta tradução à leitura do original.""",
    ),
    (
        "Analisar e comparar React vs Vue para um projeto de dashboard administrativo",
        """Você é um arquiteto de software com experiência em ambos os frameworks.

Tarefa: Compare React e Vue para o desenvolvimento de um dashboard administrativo com as seguintes características:
- Equipe de 3 devs com experiência intermediária
- Prazo de 3 meses
- Necessidade de gráficos complexos e tabelas com paginação
- Manutenção de longo prazo prevista

Formato de saída: tabela comparativa Markdown seguida de recomendação fundamentada (2 parágrafos).
Colunas da tabela: Critério | React | Vue | Peso (1-3)

Restrições: baseie-se em dados concretos (tamanho do ecossistema, curva de aprendizado, performance).
Critério de qualidade: a recomendação deve ser acionável e justificada com base nos requisitos fornecidos.""",
    ),
    (
        "Criar um script Python para automatizar backup de banco de dados PostgreSQL",
        """Você é um engenheiro DevOps especializado em automação e confiabilidade.

Tarefa: Escreva um script Python que:
1. Conecte ao PostgreSQL usando variáveis de ambiente
2. Execute pg_dump para gerar backup comprimido
3. Faça upload para S3 com nome no formato backup_YYYY-MM-DD_HH-MM.sql.gz
4. Envie notificação por email em caso de falha
5. Mantenha apenas os últimos 7 backups no S3

Formato de saída: script Python completo com docstrings, logging estruturado e tratamento de exceções.
Restrições: use boto3 para S3; não hardcode credenciais; compatível com Python 3.9+.
Critério de qualidade: o script deve ser idempotente e seguro para rodar via cron.""",
    ),
    (
        "Escrever testes unitários para uma função de validação de CPF em JavaScript",
        """Você é um engenheiro de qualidade especializado em testes automatizados.

Tarefa: Escreva testes unitários completos para uma função validateCPF(cpf: string): boolean.

Formato de saída: arquivo TypeScript usando Jest com:
- Testes para CPFs válidos (mínimo 5 casos)
- Testes para CPFs inválidos (formato, dígitos verificadores, sequências repetidas)
- Testes para edge cases (null, undefined, string vazia, com/sem formatação)
- Descrições claras em português nos blocos describe/it

Restrições: cobertura mínima de 95%; sem dependências externas além do Jest.
Critério de qualidade: os testes devem falhar se a implementação estiver incorreta e passar com uma implementação correta.""",
    ),
    (
        "Criar um plano de conteúdo para redes sociais de uma startup de fintech",
        """Você é um estrategista de conteúdo especializado em fintech e marketing digital.

Tarefa: Crie um plano de conteúdo mensal para LinkedIn e Instagram de uma fintech B2B que oferece gestão financeira para PMEs.

Formato de saída: tabela Markdown com colunas:
| Semana | Plataforma | Tipo de conteúdo | Tema | Objetivo | CTA |

Inclua 4 semanas × 3 posts por semana por plataforma (24 posts no total).

Restrições: equilibre conteúdo educativo (60%), institucional (20%) e promocional (20%); tom profissional mas acessível.
Critério de qualidade: cada post deve ter objetivo claro e CTA específico.""",
    ),
    (
        "Explicar o conceito de event sourcing para um time de desenvolvimento",
        """Você é um arquiteto de software especializado em sistemas distribuídos e DDD.

Tarefa: Explique o padrão Event Sourcing para um time de desenvolvimento com experiência em CRUD tradicional mas sem experiência em arquiteturas orientadas a eventos.

Formato de saída: documento Markdown com:
1. Definição em 1 parágrafo
2. Comparação com CRUD tradicional (tabela)
3. Exemplo prático com código (sistema de conta bancária)
4. Quando usar e quando NÃO usar (lista)
5. Ferramentas recomendadas para Node.js

Restrições: use analogias concretas; inclua diagrama ASCII do fluxo de eventos; máximo 800 palavras.
Critério de qualidade: um dev sem experiência em event sourcing deve conseguir implementar um protótipo após ler o documento.""",
    ),
]

# Variações de categoria para aumentar diversidade
CATEGORIES = ["code", "analysis", "summary", "marketing", "brainstorming", "translation", "qa", "creative"]

def augment(instruction: str, output: str, n: int) -> list[dict]:
    """Gera n variações leves de um par (instruction, output)."""
    prefixes = [
        "", "Por favor, ", "Preciso que você ", "Quero que você ",
        "Você pode ", "Me ajude a ",
    ]
    results = [{"instruction": instruction, "input": "", "output": output}]
    for i in range(1, n):
        prefix = prefixes[i % len(prefixes)]
        results.append({
            "instruction": prefix + instruction[0].lower() + instruction[1:],
            "input": "",
            "output": output,
        })
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="dataset.jsonl")
    parser.add_argument("--min", type=int, default=50, help="Mínimo de exemplos no dataset")
    args = parser.parse_args()

    samples = []
    repeats = max(1, (args.min + len(EXAMPLES) - 1) // len(EXAMPLES))

    for instruction, output in EXAMPLES:
        samples.extend(augment(instruction, output, repeats))

    random.shuffle(samples)
    samples = samples[:max(args.min, len(samples))]

    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as f:
        for s in samples:
            f.write(json.dumps(s, ensure_ascii=False) + "\n")

    print(f"✔ Dataset seed gerado: {len(samples)} exemplos → {out}")
    print(f"\nPróximo passo:")
    print(f"  python training/finetune.py --dataset {out}")


if __name__ == "__main__":
    main()
