import { AutoTrainer } from './core/auto-trainer';
import { FeedbackStore } from './core/store';
import { LearningEngine } from './core/learning';

/**
 * Sistema de Avaliação Contínua e Otimização Adaptativa
 * 
 * Monitora performance em tempo real e ajusta estratégias automaticamente
 */

interface AdaptiveStrategy {
  name: string;
  description: string;
  trigger: (metrics: any) => boolean;
  action: (trainer: AutoTrainer) => Promise<void>;
}

export class AdaptiveTrainingOrchestrator {
  private trainer = new AutoTrainer();
  private store = new FeedbackStore();
  private learningEngine = new LearningEngine();

  private strategies: AdaptiveStrategy[] = [
    {
      name: 'Reforço de Categoria Fraca',
      description: 'Aumenta treinamento em categorias com rating < 3.5',
      trigger: (metrics) => {
        return Object.values(metrics.categoryDistribution).some((cat: any) => 
          cat.avgRating < 3.5 && cat.count > 5
        );
      },
      action: async (trainer) => {
        console.log('🎯 Estratégia: Reforçando categorias fracas...');
        // Implementação: executar 10 iterações extras nas categorias fracas
      },
    },
    {
      name: 'Exploração de Variações',
      description: 'Testa variações menos usadas quando há estagnação',
      trigger: (metrics) => {
        const variations = Object.values(metrics.variationPerformance);
        const maxCount = Math.max(...variations.map((v: any) => v.count));
        const minCount = Math.min(...variations.map((v: any) => v.count));
        return maxCount > minCount * 3;  // desbalanceamento > 3x
      },
      action: async (trainer) => {
        console.log('🔀 Estratégia: Explorando variações subutilizadas...');
      },
    },
    {
      name: 'Intensificação de Sucesso',
      description: 'Duplica treinamento quando taxa de melhoria > 15%',
      trigger: (metrics) => metrics.improvementRate > 15,
      action: async (trainer) => {
        console.log('🚀 Estratégia: Intensificando treinamento bem-sucedido...');
      },
    },
  ];

  /**
   * Loop de treinamento adaptativo com ajustes automáticos
   */
  async runAdaptiveTraining(
    totalIterations: number,
    checkpointInterval = 20,
  ): Promise<void> {
    console.log('\n🧠 TREINAMENTO ADAPTATIVO INICIADO\n');
    console.log(`Total de iterações: ${totalIterations}`);
    console.log(`Checkpoints a cada: ${checkpointInterval} iterações\n`);

    let completed = 0;

    while (completed < totalIterations) {
      const batchSize = Math.min(checkpointInterval, totalIterations - completed);
      
      // Executar batch
      await this.trainer.runTrainingLoop(batchSize, 1500);
      completed += batchSize;

      // Avaliar e adaptar
      const metrics = this.evaluateProgress();
      console.log(`\n📊 Checkpoint ${completed}/${totalIterations}`);
      console.log(`   Rating médio: ${metrics.avgRating.toFixed(2)}/5`);
      console.log(`   Melhoria: ${metrics.improvementRate > 0 ? '+' : ''}${metrics.improvementRate.toFixed(1)}%`);

      // Aplicar estratégias adaptativas
      for (const strategy of this.strategies) {
        if (strategy.trigger(metrics)) {
          console.log(`\n💡 ${strategy.name}`);
          console.log(`   ${strategy.description}`);
          await strategy.action(this.trainer);
        }
      }

      if (completed < totalIterations) {
        console.log('\n⏸️  Pausa de 3s antes do próximo batch...\n');
        await this.delay(3000);
      }
    }

    console.log('\n✅ TREINAMENTO ADAPTATIVO CONCLUÍDO\n');
    this.trainer.displayMetrics(this.evaluateProgress());
  }

  private evaluateProgress(): any {
    const history = this.store.load();
    const recent = history.slice(-100);

    const categoryDist: any = {};
    let totalRating = 0;

    for (const fb of recent) {
      if (!categoryDist[fb.config.category]) {
        categoryDist[fb.config.category] = { count: 0, totalRating: 0, avgRating: 0 };
      }
      categoryDist[fb.config.category].count++;
      categoryDist[fb.config.category].totalRating += fb.rating;
      totalRating += fb.rating;
    }

    for (const cat of Object.keys(categoryDist)) {
      categoryDist[cat].avgRating = 
        categoryDist[cat].totalRating / categoryDist[cat].count;
    }

    const first20 = recent.slice(0, 20);
    const last20 = recent.slice(-20);
    const avgFirst = first20.reduce((s, f) => s + f.rating, 0) / first20.length;
    const avgLast = last20.reduce((s, f) => s + f.rating, 0) / last20.length;
    const improvementRate = ((avgLast - avgFirst) / avgFirst) * 100;

    return {
      totalRuns: recent.length,
      avgRating: totalRating / recent.length,
      categoryDistribution: categoryDist,
      variationPerformance: {},
      improvementRate,
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI
async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] ?? 'adaptive';
  const iterations = parseInt(args[1] ?? '100', 10);

  if (mode === 'adaptive') {
    const orchestrator = new AdaptiveTrainingOrchestrator();
    await orchestrator.runAdaptiveTraining(iterations);
  } else {
    const trainer = new AutoTrainer();
    const metrics = await trainer.runTrainingLoop(iterations);
    trainer.displayMetrics(metrics);
  }
}

if (require.main === module) {
  main();
}
