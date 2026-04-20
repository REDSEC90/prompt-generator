/**
 * RetryManager — executa uma função assíncrona com backoff exponencial.
 *
 * Retenta em erros de rede e respostas HTTP 429/503/504.
 * Falha imediatamente em erros 4xx (exceto 429).
 */
export class RetryManager {
  constructor(
    private readonly maxRetries = 3,
    private readonly baseDelayMs = 1000,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const status: number | undefined = err?.status ?? err?.response?.status;

        // Erros 4xx (exceto 429) não devem ser retentados
        if (status && status >= 400 && status < 500 && status !== 429) throw err;

        if (attempt < this.maxRetries) {
          await sleep(this.baseDelayMs * 2 ** attempt);
        }
      }
    }

    throw lastError;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
