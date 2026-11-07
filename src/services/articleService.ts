import meta from "../data/articles.json";
import parallels from "../data/articles/parallels.txt?raw";
import cigarettes from "../data/articles/cigarettes.txt?raw";

export interface ArticleMeta {
  slug: string;
  file: string;
  publication: string;
  section: string;
  title: string;
  subtitle: string;
  author: string;
  date: string;
  likes: number;
  url: string;
  style: "reader" | "editorial";
  complete: boolean;
}

const TEXT: Record<string, string> = { parallels, cigarettes };

export const articles = meta as ArticleMeta[];
export const getArticle = (slug?: string | null) => articles.find((a) => a.slug === slug);

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "hr" };

/** Plain-text → blocks. See src/data/articles/README.md for the format. */
export function parseArticle(raw: string): Block[] {
  return raw
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s): Block => {
      if (s === "---") return { kind: "hr" };
      if (s.startsWith("# ")) return { kind: "h", text: s.slice(2) };
      if (s.startsWith("> ")) return { kind: "quote", text: s.replace(/^> ?/gm, "") };
      return { kind: "p", text: s };
    });
}

export function articleBlocks(a: ArticleMeta): Block[] {
  return parseArticle(TEXT[a.file] ?? "");
}
