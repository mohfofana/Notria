type PromptMetricEntry = {
  promptId: string;
  version: string;
  calls: number;
  successes: number;
  fallbacks: number;
  totalLatencyMs: number;
  lastLatencyMs: number;
  qualityEvents: number;
};

const promptMetrics = new Map<string, PromptMetricEntry>();

function keyOf(promptId: string, version: string) {
  return `${promptId}@${version}`;
}

function getOrCreate(promptId: string, version: string): PromptMetricEntry {
  const key = keyOf(promptId, version);
  const current = promptMetrics.get(key);
  if (current) return current;
  const created: PromptMetricEntry = {
    promptId,
    version,
    calls: 0,
    successes: 0,
    fallbacks: 0,
    totalLatencyMs: 0,
    lastLatencyMs: 0,
    qualityEvents: 0,
  };
  promptMetrics.set(key, created);
  return created;
}

export const AIMetricsService = {
  startTimer(promptId: string, version: string) {
    const startedAt = Date.now();
    const entry = getOrCreate(promptId, version);
    entry.calls += 1;
    return () => Date.now() - startedAt;
  },

  recordSuccess(promptId: string, version: string, latencyMs: number) {
    const entry = getOrCreate(promptId, version);
    entry.successes += 1;
    entry.totalLatencyMs += latencyMs;
    entry.lastLatencyMs = latencyMs;
  },

  recordFallback(promptId: string, version: string, latencyMs: number) {
    const entry = getOrCreate(promptId, version);
    entry.fallbacks += 1;
    entry.totalLatencyMs += latencyMs;
    entry.lastLatencyMs = latencyMs;
  },

  recordQualityEvent(promptId: string, version: string) {
    const entry = getOrCreate(promptId, version);
    entry.qualityEvents += 1;
  },

  snapshot() {
    const items = Array.from(promptMetrics.values()).map((item) => ({
      ...item,
      avgLatencyMs: item.calls > 0 ? Math.round(item.totalLatencyMs / item.calls) : 0,
      fallbackRate: item.calls > 0 ? Number((item.fallbacks / item.calls).toFixed(3)) : 0,
    }));

    const totals = items.reduce(
      (acc, item) => {
        acc.calls += item.calls;
        acc.successes += item.successes;
        acc.fallbacks += item.fallbacks;
        acc.qualityEvents += item.qualityEvents;
        return acc;
      },
      { calls: 0, successes: 0, fallbacks: 0, qualityEvents: 0 },
    );

    return {
      totals: {
        ...totals,
        fallbackRate: totals.calls > 0 ? Number((totals.fallbacks / totals.calls).toFixed(3)) : 0,
      },
      prompts: items,
    };
  },
};
