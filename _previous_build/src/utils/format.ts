export const fmtDate = (d?: string) => d ?? "date unknown";
export const fmtTime = (iso: string) => iso.replace("T", " ").replace(/\.\d+Z$/, "Z");
export const short = (hash: string | null, n = 12) => (hash ? hash.slice(0, n) + "…" : "GENESIS");
export const TYPE_LABEL: Record<string, string> = {
  artist: "Artist", startup: "Startup", institution: "Institution", project: "Project", other: "Other",
};
export const VERIFICATION_LABEL: Record<string, string> = {
  verified: "Verified", partially_verified: "Partially verified", needs_review: "Needs review",
};
export const ACQUISITION_LABEL: Record<string, string> = {
  api: "Retrieved by API adapter",
  manual_from_page: "Transcribed from public page",
  seeded_unretrieved: "Seeded from builder’s recollection (not machine-retrieved)",
  fixture: "Fictional test fixture",
};
export function download(name: string, text: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
