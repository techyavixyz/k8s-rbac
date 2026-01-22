import NodeCache from "node-cache";

export const cache = new NodeCache({
  stdTTL: 30,          // 30 seconds default
  checkperiod: 60
});

export function cached(key, fetcher, ttl = 30) {
  const hit = cache.get(key);
  if (hit) return Promise.resolve(hit);

  return fetcher().then(data => {
    cache.set(key, data, ttl);
    return data;
  });
}
