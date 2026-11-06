import type { Fetcher, NormalizedCandidate, SourceAdapter } from "./adapter";

/** The Metropolitan Museum of Art Collection API. Docs: https://metmuseum.github.io/  (UNTESTED against the live API: written without network access.) */
export interface MetObject {
  objectID: number;
  title?: string;
  artistDisplayName?: string;
  objectDate?: string;
  medium?: string;
  department?: string;
  objectURL?: string;
  isPublicDomain?: boolean;
  creditLine?: string;
}

const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

export function metAdapter(fetcher: Fetcher): SourceAdapter<MetObject> {
  const getById = async (id: string): Promise<MetObject> => {
    const o = (await (await fetcher(`${BASE}/objects/${id}`)).json()) as MetObject;
    if (typeof o.objectID !== "number") throw new Error("Unexpected Met response shape");
    return o;
  };
  return {
    sourceName: "The Met Collection API",
    async search(query, limit = 5) {
      const s = (await (await fetcher(`${BASE}/search?q=${encodeURIComponent(query)}&artistOrCulture=true`)).json()) as { objectIDs?: number[] | null };
      const ids = (s.objectIDs ?? []).slice(0, limit);
      const out: MetObject[] = [];
      for (const id of ids) out.push(await getById(String(id)));
      return out;
    },
    getById,
    normalize(r): NormalizedCandidate {
      return {
        displayName: r.artistDisplayName?.trim() || "(artist not stated)",
        sourceUrl: r.objectURL || `https://www.metmuseum.org/art/collection/search/${r.objectID}`,
        sourceRecordId: String(r.objectID),
        provider: "The Met Collection API",
        apiEndpoint: `${BASE}/objects/${r.objectID}`,
        retrievedAt: new Date().toISOString(),
        normalizedFields: {
          objectTitle: r.title ?? null,
          date: r.objectDate ?? null,
          medium: r.medium ?? null,
          department: r.department ?? null,
          creditLine: r.creditLine ?? null,
          isPublicDomain: r.isPublicDomain ?? false,
        },
        reuseNotes: r.isPublicDomain ? "Flagged public domain by the Met; still confirm image-use terms." : "Not flagged public domain: do not reproduce images.",
      };
    },
  };
}
