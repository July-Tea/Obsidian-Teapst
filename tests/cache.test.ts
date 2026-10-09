import { describe, expect, it } from 'vitest';
import { BoundedCache } from '../src/cache';

describe('BoundedCache', () => {
	it('returns undefined for missing keys and the stored value for hits', () => {
		const cache = new BoundedCache<string, number>(10);
		expect(cache.get('x')).toBeUndefined();
		cache.set('x', 1);
		expect(cache.get('x')).toBe(1);
	});

	it('does not evict while under capacity', () => {
		const cache = new BoundedCache<string, number>(5);
		for (let i = 0; i < 5; i++) cache.set(`k${i}`, i);
		expect(cache.size).toBe(5);
		for (let i = 0; i < 5; i++) expect(cache.get(`k${i}`)).toBe(i);
	});

	it('evicts the oldest ~evictFraction entries once capacity is exceeded', () => {
		// maxEntries=10, evictFraction=0.1 -> evicts 1 entry once full, then
		// inserts the new one, so size stays at 10 and the oldest key is gone.
		const cache = new BoundedCache<string, number>(10, 0.1);
		for (let i = 0; i < 10; i++) cache.set(`k${i}`, i);
		expect(cache.size).toBe(10);

		cache.set('k10', 10);
		expect(cache.size).toBe(10);
		expect(cache.get('k0')).toBeUndefined();
		expect(cache.get('k1')).toBe(1);
		expect(cache.get('k10')).toBe(10);
	});
});
