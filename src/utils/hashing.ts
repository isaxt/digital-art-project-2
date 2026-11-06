/** SHA-256 hex via Web Crypto (available in browsers and Node >= 19, so one code path serves both). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function shortHash(input: string, length = 12): Promise<string> {
  return (await sha256Hex(input)).slice(0, length).toUpperCase();
}
