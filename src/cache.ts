// A small bounded cache for memoizing conversion results. When full, the
// oldest `evictFraction` of entries are dropped at once (insertion order via
// Map iteration) rather than evicting one entry per insert.
export class BoundedCache<K, V> {
	private readonly store = new Map<K, V>();

	constructor(private readonly maxEntries: number, private readonly evictFraction = 0.1) {}

	get size(): number {
		return this.store.size;
	}

	get(key: K): V | undefined {
		return this.store.get(key);
	}

	set(key: K, value: V): void {
		if (this.store.size >= this.maxEntries) this.evict();
		this.store.set(key, value);
	}

	private evict(): void {
		const toDelete = Math.ceil(this.maxEntries * this.evictFraction);
		let deleted = 0;
		for (const key of this.store.keys()) {
			if (deleted >= toDelete) break;
			this.store.delete(key);
			deleted++;
		}
	}
}
