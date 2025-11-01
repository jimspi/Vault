import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export default function rateLimit(options?: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000,
  });

  return {
    check: async (limit: number, token: string): Promise<void> => {
      const tokenCount = (tokenCache.get(token) as number) || 0;

      if (tokenCount >= limit) {
        throw new Error('Rate limit exceeded');
      }

      tokenCache.set(token, tokenCount + 1);
    },
  };
}
