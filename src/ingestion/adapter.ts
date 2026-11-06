/** Shared shape for source adapters (spec §10.3). Adapters return NORMALIZED candidates, never raw API objects. */
export interface NormalizedCandidate {
  displayName: string;
  description?: string;
  sourceUrl: string;
  sourceRecordId: string;
  provider: string;
  apiEndpoint: string;
  retrievedAt: string;
  normalizedFields: Record<string, unknown>;
  reuseNotes?: string;
}

export interface SourceAdapter<T> {
  sourceName: string;
  search(query: string, limit?: number): Promise<T[]>;
  getById(id: string): Promise<T>;
  normalize(record: T): NormalizedCandidate;
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

/** Polite fetch: fixed delay between calls, one retry on 429/5xx, descriptive User-Agent when provided. */
export function politeFetcher(opts: { delayMs?: number; userAgent?: string; fetchImpl?: Fetcher } = {}): Fetcher {
  const delay = opts.delayMs ?? 400;
  const f = opts.fetchImpl ?? ((u, i) => fetch(u, i));
  let last = 0;
  return async (url, init) => {
    const wait = Math.max(0, last + delay - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    const headers = { ...(init?.headers ?? {}), ...(opts.userAgent ? { "User-Agent": opts.userAgent } : {}) };
    let res = await f(url, { ...init, headers });
    if (res.status === 429 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 2000));
      res = await f(url, { ...init, headers });
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res;
  };
}
