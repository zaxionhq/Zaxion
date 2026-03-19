import logger from '../logger.js';

class LRUCache {
  constructor(maxSize = 1000, ttlMs = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    const item = this.cache.get(key);
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    // Move to end to mark as recently used
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first item in Map)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      logger.debug({ evictedKey: firstKey }, 'LRUCache: Evicted item');
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttlMs
    });
  }

  clear() {
    this.cache.clear();
  }
}

// Global AST Cache: Max 1000 ASTs, 24h TTL
export const astCache = new LRUCache(1000, 24 * 60 * 60 * 1000);
