import { PromptConfig, Category, OutputFormat, Tone } from './types';
import { TemplateEngine } from './engine';
import { VariationGenerator } from './variations';
import { callOllamaSilent } from './ai';
import { FeedbackStore } from './store';
import { LearningEngine, PromptFeedback, FailureReason } from './learning';

/**
 * AutoTrainer — Sistema de treinamento automatizado para Ollama
 * 
 * Gera inputs diversificados, executa prompts, avalia respostas
 * e alimenta o sistema de aprendizado contínuo.
 */

interface TrainingScenario {
  theme: string;
  action: string;
  category: Category;
  audience: string;
  objective: string;
  tone: Tone;
  format: OutputFormat;
  language?: string;
  expectedKeywords: string[];  // palavras-chave esperadas na resposta
  minLength: number;           // comprimento mínimo esperado
}

interface TrainingMetrics {
  totalRuns: number;
  avgRating: number;
  categoryDistribution: Record<Category, number>;
  variationPerformance: Record<string, { count: number; avgRating: number }>;
  improvementRate: number;  // % de melhoria ao longo do tempo
}

export class AutoTrainer {
  private engine = new TemplateEngine();
  private variationGen = new VariationGenerator();
  private store = new FeedbackStore();
  private learningEngine = new LearningEngine();

  /**
   * Cenários de treinamento diversificados para evitar viés
   */
  private scenarios: TrainingScenario[] = [
    // CODE
    {
      theme: 'autenticação JWT',
      action: 'implemente',
      category: 'code',
      audience: 'desenvolvedor backend',
      objective: 'middleware de autenticação com refresh token',
      tone: 'technical',
      format: 'code',
      language: 'TypeScript',
      expectedKeywords: ['jwt', 'verify', 'token', 'middleware'],
      minLength: 200,
    },
    {
      theme: 'API REST CRUD',
      action: 'crie',
      category: 'code',
      audience: 'desenvolvedor fullstack',
      objective: 'endpoints completos com validação',
      tone: 'technical',
      format: 'code',
      language: 'Python',
      expectedKeywords: ['post', 'get', 'put', 'delete', 'validation'],
      minLength: 300,
    },
    {
      theme: 'websocket real-time',
      action: 'desenvolva',
      category: 'code',
      audience: 'desenvolvedor Node.js',
      objective: 'chat em tempo real com rooms',
      tone: 'technical',
      format: 'code',
      language: 'JavaScript',
      expectedKeywords: ['socket', 'emit', 'on', 'room'],
      minLength: 250,
    },

    // ANALYSIS
    {
      theme: 'arquitetura microserviços vs monolito',
      action: 'compare',
      category: 'analysis',
      audience: 'arquiteto de software',
      objective: 'análise de trade-offs para sistema de e-commerce',
      tone: 'technical',
      format: 'table',
      expectedKeywords: ['escalabilidade', 'complexidade', 'deploy', 'manutenção'],
      minLength: 300,
    },
    {
      theme: 'performance de banco de dados',
      action: 'analise',
      category: 'analysis',
      audience: 'DBA',
      objective: 'identificar gargalos em queries lentas',
      tone: 'technical',
      format: 'numbered-list',
      expectedKeywords: ['índice', 'query', 'otimização', 'explain'],
      minLength: 200,
    },

    // SUMMARY
    {
      theme: 'documentação técnica de API',
      action: 'resuma',
      category: 'summary',
      audience: 'desenvolvedor frontend',
      objective: 'guia rápido de integração',
      tone: 'didactic',
      format: 'markdown',
      expectedKeywords: ['endpoint', 'autenticação', 'exemplo', 'resposta'],
      minLength: 150,
    },
    {
      theme: 'changelog de release',
      action: 'sintetize',
      category: 'summary',
      audience: 'usuário final',
      objective: 'novidades da versão 2.0',
      tone: 'friendly',
      format: 'numbered-list',
      expectedKeywords: ['novo', 'melhorado', 'corrigido'],
      minLength: 100,
    },

    // BRAINSTORMING
    {
      theme: 'features para app de produtividade',
      action: 'sugira',
      category: 'brainstorming',
      audience: 'product manager',
      objective: '10 funcionalidades inovadoras',
      tone: 'persuasive',
      format: 'numbered-list',
      expectedKeywords: ['usuário', 'produtividade', 'integração'],
      minLength: 200,
    },
    {
      theme: 'estratégias de cache distribuído',
      action: 'proponha',
      category: 'brainstorming',
      audience: 'engenheiro de infraestrutura',
      objective: 'soluções para alta disponibilidade',
      tone: 'technical',
      format: 'markdown',
      expectedKeywords: ['redis', 'consistência', 'invalidação'],
      minLength: 250,
    },

    // MARKETING
    {
      theme: 'landing page para SaaS B2B',
      action: 'escreva',
      category: 'marketing',
      audience: 'decisor técnico',
      objective: 'copy persuasivo focado em ROI',
      tone: 'persuasive',
      format: 'prose',
      expectedKeywords: ['economia', 'eficiência', 'integração', 'suporte'],
      minLength: 200,
    },

    // TRANSLATION
    {
      theme: 'documentação técnica EN→PT',
      action: 'traduza',
      category: 'translation',
      audience: 'desenvolvedor brasileiro',
      objective: 'manter terminologia técnica precisa',
      tone: 'technical',
      format: 'markdown',
      expectedKeywords: ['tradução', 'técnico'],
      minLength: 150,
    },

    // QA
    {
      theme: 'debugging de memory leak',
      action: 'explique',
      category: 'qa',
      audience: 'desenvolvedor júnior',
      objective: 'como identificar e corrigir vazamentos de memória',
      tone: 'didactic',
      format: 'numbered-list',
      expectedKeywords: ['memória', 'heap', 'profiler', 'garbage'],
      minLength: 200,
    },

    // CREATIVE
    {
      theme: 'nome para startup de DevOps',
      action: 'crie',
      category: 'creative',
      audience: 'fundadores',
      objective: '5 nomes memoráveis com domínio disponível',
      tone: 'friendly',
      format: 'numbered-list',
      expectedKeywords: ['nome', 'disponível'],
      minLength: 100,
    },
  ];

  /**
   * Executa loop de treinamento automatizado
   */
  async runTrainingLoop(iterations: number, delayMs = 0): Promise<TrainingMetrics> {
    console.log(`\n🎯 Iniciando treinamento automatizado: ${iterations} iterações\n`);

    const startTime = Date.now();
    let successCount = 0;
    // Cache do histórico em memória — evita leitura de disco a cada iteração
    let history = this.store.load();

    for (let i = 0; i < iterations; i++) {
      const scenario = this.selectScenario(i);
      console.log(`\n[${ i + 1 }/${iterations}] ${scenario.category.toUpperCase()} — ${scenario.theme}`);

      try {
        const feedback = await this.runSingleTraining(scenario, history);
        history.push(feedback);
        successCount++;
      } catch (err) {
        console.error(`  ❌ Erro: ${err instanceof Error ? err.message : String(err)}`);
      }

      if (delayMs > 0 && i < iterations - 1) {
        await this.delay(delayMs);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Treinamento concluído: ${successCount}/${iterations} sucessos em ${elapsed}s\n`);

    return this.calculateMetrics();
  }

  /**
   * Executa um único ciclo de treinamento
   */
  private async runSingleTraining(scenario: TrainingScenario, history: PromptFeedback[]): Promise<PromptFeedback> {
    // 1. Criar configuração
    const config: PromptConfig = {
      theme: scenario.theme,
      action: scenario.action,
      category: scenario.category,
      audience: scenario.audience,
      objective: scenario.objective,
      tone: scenario.tone,
      format: scenario.format,
      language: scenario.language,
    };

    // 2. Aplicar sugestões do learning engine (usa histórico em cache)
    const suggestions = this.learningEngine.suggest(config, history);
    Object.assign(config, suggestions);

    // 3. Gerar prompt
    this.engine.fill(config);
    const variations = this.variationGen.generate(config);

    // 4. Selecionar variação baseada em histórico
    const variation = this.selectBestVariation(config.category, history);
    const finalPrompt = variations[variation];

    // 5. Executar no Ollama sem streaming (mais rápido para batch)
    console.log(`  🔄 Executando variação: ${variation}`);
    const response = await callOllamaSilent(finalPrompt, { temperature: 0.7, num_predict: 600 });

    // 6. Avaliar resposta automaticamente
    const rating = this.evaluateResponse(response, scenario);
    console.log(`  ⭐ Rating automático: ${rating}/5`);

    // 7. Montar e salvar feedback
    const feedback: PromptFeedback = {
      config,
      generatedPrompt: finalPrompt,
      rating,
      usedVariation: variation,
      timestamp: Date.now(),
    };

    if (rating <= 2) {
      feedback.failureReason = this.detectFailureReason(response, scenario);
      console.log(`  ⚠️  Motivo da falha: ${feedback.failureReason}`);
    }

    this.store.save(feedback);
    return feedback;
  }

  /**
   * Seleciona cenário de forma balanceada (round-robin com shuffle)
   */
  private selectScenario(iteration: number): TrainingScenario {
    const shuffled = this.shuffleArray([...this.scenarios]);
    return shuffled[iteration % shuffled.length];
  }

  /**
   * Seleciona melhor variação baseada em histórico da categoria
   */
  private selectBestVariation(
    category: Category,
    history: PromptFeedback[],
  ): 'direct' | 'contextual' | 'chainOfThought' {
    const relevant = history.filter(f => f.config.category === category);
    
    if (relevant.length < 3) {
      return 'contextual';  // padrão seguro
    }

    const avgByVariation: Record<string, { sum: number; count: number }> = {
      direct: { sum: 0, count: 0 },
      contextual: { sum: 0, count: 0 },
      chainOfThought: { sum: 0, count: 0 },
    };

    for (const fb of relevant) {
      avgByVariation[fb.usedVariation].sum += fb.rating;
      avgByVariation[fb.usedVariation].count++;
    }

    let best: 'direct' | 'contextual' | 'chainOfThought' = 'contextual';
    let bestAvg = 0;

    for (const [variation, data] of Object.entries(avgByVariation)) {
      if (data.count > 0) {
        const avg = data.sum / data.count;
        if (avg > bestAvg) {
          bestAvg = avg;
          best = variation as typeof best;
        }
      }
    }

    return best;
  }

  /**
   * Avalia resposta automaticamente baseada em critérios objetivos
   */
  private evaluateResponse(response: string, scenario: TrainingScenario): 1 | 2 | 3 | 4 | 5 {
    let score = 3;  // baseline

    // Critério 1: Comprimento adequado
    if (response.length >= scenario.minLength) {
      score++;
    } else if (response.length < scenario.minLength * 0.5) {
      score--;
    }

    // Critério 2: Presença de palavras-chave esperadas
    const lowerResponse = response.toLowerCase();
    const keywordMatches = scenario.expectedKeywords.filter(kw =>
      lowerResponse.includes(kw.toLowerCase())
    ).length;

    const keywordRatio = keywordMatches / scenario.expectedKeywords.length;
    if (keywordRatio >= 0.7) {
      score++;
    } else if (keywordRatio < 0.3) {
      score--;
    }

    // Critério 3: Estrutura adequada ao formato
    if (scenario.format === 'code' && response.includes('```')) {
      score += 0.5;
    } else if (scenario.format === 'markdown' && response.includes('##')) {
      score += 0.5;
    } else if (scenario.format === 'numbered-list' && /^\d+\./.test(response)) {
      score += 0.5;
    }

    // Normalizar para 1-5
    return Math.max(1, Math.min(5, Math.round(score))) as 1 | 2 | 3 | 4 | 5;
  }

  /**
   * Detecta motivo de falha em respostas ruins
   */
  private detectFailureReason(response: string, scenario: TrainingScenario): FailureReason {
    if (response.length < scenario.minLength * 0.3) {
      return 'too_vague';
    }

    const keywordMatches = scenario.expectedKeywords.filter(kw =>
      response.toLowerCase().includes(kw.toLowerCase())
    ).length;

    if (keywordMatches === 0) {
      return 'missing_context';
    }

    if (scenario.format === 'code' && !response.includes('```')) {
      return 'wrong_format';
    }

    if (response.length > scenario.minLength * 5) {
      return 'too_long';
    }

    return 'wrong_tone';
  }

  /**
   * Calcula métricas agregadas do treinamento
   */
  private calculateMetrics(): TrainingMetrics {
    const history = this.store.load();
    const recent = history.slice(-100);  // últimas 100 execuções

    const categoryDist: Record<Category, number> = {
      summary: 0,
      code: 0,
      analysis: 0,
      marketing: 0,
      brainstorming: 0,
      translation: 0,
      qa: 0,
      creative: 0,
    };

    const variationPerf: Record<string, { count: number; avgRating: number }> = {
      direct: { count: 0, avgRating: 0 },
      contextual: { count: 0, avgRating: 0 },
      chainOfThought: { count: 0, avgRating: 0 },
    };

    let totalRating = 0;

    for (const fb of recent) {
      categoryDist[fb.config.category]++;
      totalRating += fb.rating;

      const vp = variationPerf[fb.usedVariation];
      vp.avgRating = (vp.avgRating * vp.count + fb.rating) / (vp.count + 1);
      vp.count++;
    }

    // Calcular taxa de melhoria (últimos 20 vs primeiros 20)
    const first20 = recent.slice(0, 20);
    const last20 = recent.slice(-20);
    const avgFirst = first20.reduce((s, f) => s + f.rating, 0) / first20.length;
    const avgLast = last20.reduce((s, f) => s + f.rating, 0) / last20.length;
    const improvementRate = ((avgLast - avgFirst) / avgFirst) * 100;

    return {
      totalRuns: recent.length,
      avgRating: totalRating / recent.length,
      categoryDistribution: categoryDist,
      variationPerformance: variationPerf,
      improvementRate,
    };
  }

  /**
   * Exibe relatório detalhado de métricas
   */
  displayMetrics(metrics: TrainingMetrics): void {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║     RELATÓRIO DE TREINAMENTO           ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log(`📊 Total de execuções: ${metrics.totalRuns}`);
    console.log(`⭐ Rating médio: ${metrics.avgRating.toFixed(2)}/5`);
    console.log(`📈 Taxa de melhoria: ${metrics.improvementRate > 0 ? '+' : ''}${metrics.improvementRate.toFixed(1)}%\n`);

    console.log('📂 Distribuição por categoria:');
    for (const [cat, count] of Object.entries(metrics.categoryDistribution)) {
      if (count > 0) {
        console.log(`   ${cat.padEnd(15)} ${count} execuções`);
      }
    }

    console.log('\n🔀 Performance por variação:');
    for (const [variation, data] of Object.entries(metrics.variationPerformance)) {
      if (data.count > 0) {
        console.log(`   ${variation.padEnd(15)} ${data.avgRating.toFixed(2)}/5 (${data.count} usos)`);
      }
    }

    console.log('\n💡 Insights do Learning Engine:');
    const insights = this.learningEngine.analyze(this.store.load());
    for (const insight of insights.slice(0, 3)) {
      console.log(`\n   ${insight.category.toUpperCase()} (${insight.totalSamples} amostras, confiança: ${insight.confidence})`);
      console.log(`   Melhor variação: ${insight.bestVariation}`);
      for (const suggestion of insight.suggestions) {
        console.log(`   • ${suggestion}`);
      }
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
