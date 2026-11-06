import type { NormalizedCandidate, SourceAdapter } from "./adapter";

/**
 * Art Institute of Chicago adapter. Docs: https://api.artic.edu/docs/
 * NOTE: written against the documented API; not exercised in the build environment
 * (outbound access to api.artic.edu was blocked there). Run it locally and review output.
 */
export interface AicArtwork {
  id: number; title: string; artist_title: string | null; artist_id: number | null;
  date_display: string | null; department_title: string | null; medium_display: string | null;
  is_public_domain: boolean | null; api_link: string;
}

const BASE = "https://api.artic.edu/api/v1";
const FIELDS = "id,title,artist_title,artist_id,date_display,department_title,medium_display,is_public_domain,api_link";
const UA = "OfficeOfCulturalFuturesResearchScript/0.1 (academic art project)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string): Promise<{ data: unknown }> {
  const res = await fetch(url, { headers: { "AIC-User-Agent": UA, "User-Agent": UA } });
  if (!res.ok) throw new Error(`AIC API ${res.status} for ${url}`);
  await sleep(1000); // be polite: one request per second
  return res.json() as Promise<{ data: unknown }>;
}

export const artInstituteAdapter: SourceAdapter<AicArtwork> = {
  sourceName: "Art Institute of Chicago API",
  async search(query) {
    const url = `${BASE}/artworks/search?q=${encodeURIComponent(query)}&limit=10&fields=${FIELDS}`;
    const { data } = await getJson(url);
    if (!Array.isArray(data)) throw new Error("Unexpected AIC response shape");
    return data as AicArtwork[];
  },
  async getById(id) {
    const { data } = await getJson(`${BASE}/artworks/${id}?fields=${FIELDS}`);
    if (!data || typeof data !== "object") throw new Error("Unexpected AIC response shape");
    return data as AicArtwork;
  },
  normalize(r): NormalizedCandidate {
    return {
      displayName: r.artist_title ?? "(unattributed)",
      description: undefined, // collection records carry no artist statement or biography
      sourceUrl: `https://www.artic.edu/artworks/${r.id}`,
      sourceRecordId: String(r.id),
      normalizedFields: {
        artworkTitle: r.title, dateDisplay: r.date_display, department: r.department_title,
        medium: r.medium_display, isPublicDomain: r.is_public_domain, apiLink: r.api_link,
      },
    };
  },
};
