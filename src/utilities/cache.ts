import NodeCache from 'node-cache';

class LocalCache {
  private static instance: LocalCache;
  private cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache({ checkperiod: 120 });
  }

  public set(key: string, value: any, ttl: number) {
    return this.cache.set(key, value, ttl);
  }

  public get(key: string): any {
    return this.cache.get(key);
  }

  public delete(key: string) {
    return this.cache.del(key);
  }

  public clearAll() {
    this.cache.flushAll();
  }

  public static getInstance(): LocalCache {
    if (!LocalCache.instance) LocalCache.instance = new LocalCache();
    return LocalCache.instance;
  }
}

export default LocalCache.getInstance();
