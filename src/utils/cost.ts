export const MODEL_PRICES: Record<string, number> = {
  haiku: 0.25,
  sonnet: 3,
  opus: 15,
};

export function calcCost(tokens: number, model: string): number {
  const price = MODEL_PRICES[model] ?? MODEL_PRICES.sonnet;
  return (tokens / 1_000_000) * price;
}

export function calcDailyCost(byModel: { haiku: number; sonnet: number; opus: number }): {
  total: number;
  byModel: Record<string, number>;
} {
  const costs = {
    haiku: calcCost(byModel.haiku, 'haiku'),
    sonnet: calcCost(byModel.sonnet, 'sonnet'),
    opus: calcCost(byModel.opus, 'opus'),
  };
  return { total: costs.haiku + costs.sonnet + costs.opus, byModel: costs };
}
