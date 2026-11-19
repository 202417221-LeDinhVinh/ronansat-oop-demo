/**
 * Ch.9(c): generic page container used by listing services.
 *
 * `Page<T>` is parameterized by the item type, so the same class can carry tests, questions,
 * error-log views, or any other collection. It also exposes a generic `map<U>()` that converts
 * a page of one type into a page of another type without losing pagination metadata.
 */
export class Page<T> {
    public constructor(
        public readonly items: readonly T[],
        public readonly total: number,
        public readonly page: number,
        public readonly pageSize: number
    ) {}

    public get totalPages(): number {
        if (this.total === 0) return 0;
        return Math.ceil(this.total / this.pageSize);
    }

    public map<U>(mapper: (item: T, index: number) => U): Page<U> {
        return new Page(this.items.map(mapper), this.total, this.page, this.pageSize);
    }

    /**
     * Slices a complete collection into one page.
     * Page numbers are 1-based; invalid values fall back to page 1 and a page size of at least 1.
     */
    public static of<T>(allItems: readonly T[], page: number, pageSize: number): Page<T> {
        const safePage = Number.isFinite(page) && page > 0 ? Math.trunc(page) : 1;
        const safeSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.trunc(pageSize) : 1;
        const start = (safePage - 1) * safeSize;
        return new Page(allItems.slice(start, start + safeSize), allItems.length, safePage, safeSize);
    }
}
