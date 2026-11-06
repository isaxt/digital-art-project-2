/** Shared adapter contract (spec 10.3). Ingestion runs in Node scripts, never in the browser. */
export interface NormalizedCandidate {
  displayName: string;
  description?: string;
  sourceUrl: string;
  sourceRecordId: string;
  normalizedFields: Record<string, unknown>;
}

export interface SourceAdapter<T> {
  sourceName: string;
  search(query: string): Promise<T[]>;
  getById(id: string): Promise<T>;
  normalize(record: T): NormalizedCandidate;
}

export interface CandidateFile {
  provider: string;
  apiEndpoint: string;
  retrievedAt: string;
  query: string;
  candidates: NormalizedCandidate[];
}
