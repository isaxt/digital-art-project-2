import type { Fetcher, NormalizedCandidate, SourceAdapter } from "./adapter";

/** Art Institute of Chicago API. Docs: https://api.artic.edu/docs/  (UNTESTED against the live API: written without network access.) */
export interface AicArtwork {
  id: number;
  title?: string;
  artist_display?: string;
  date_display?: string;
  medium_display?: string;
  department_title?: string;
  api_link?: string;
}

const FIELDS = "id,title,artist_display,date_display,medium_display,department_title,api_link";
const BASE = "https://api.artic.edu/api/v1";

export function aicAdapter(fetcher: Fetcher): SourceAdapter<AicArtwork> {
  return {
    sourceName: "Art Institute of Chicago API",
    async search(query, limit = 5) {
      const url = `${BASE}/artworks/search?q=${encodeURIComponent(query)}&fields=${FIELDS}&limit=${limit}`;
      const json = (await (await fetcher(url)).json()) as { data?: AicArtwork[] };
      if (!Array.isArray(json.data)) throw new Error("Unexpected AIC response shape");
      return json.data;
    },
    async getById(id) {
      const json = (await (await fetcher(`${BASE}/artworks/${id}?fields=${FIELDS}`)).json()) as { data?: AicArtwork };
      if (!json.data || typeof json.data.id !== "number") throw new Error("Unexpected AIC response shape");
      return json.data;
    },
    normalize(r): NormalizedCandidate {
      return {
        displayName: r.artist_display?.split("\n")[0]?.trim() || "(artist not stated)",
        sourceUrl: `https://www.artic.edu/artworks/${r.id}`,
        sourceRecordId: String(r.id),
        provider: "Art Institute of Chicago API",
        apiEndpoint: r.api_link ?? `${BASE}/artworks/${r.id}`,
        retrievedAt: new Date().toISOString(),
        normalizedFields: {
          objectTitle: r.title ?? null,
          date: r.date_display ?? null,
          medium: r.medium_display ?? null,
          department: r.department_title ?? null,
        },
        reuseNotes: "Check AIC API terms and image rights before storing or displaying images. Metadata only here.",
      };
    },
  };
}
