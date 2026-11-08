/**
 * Synchronous SHA-256 (the ledger itself uses Web Crypto, which is async). Needed where hashing must be
 * fast and synchronous: the mining ritual (millions of attempts), Merkle roots, derived addresses.
 * Constants are derived from the first primes, as in FIPS 180-4; tests compare against Web Crypto.
 */
const H0 = new Uint32Array(8);
const K = new Uint32Array(64);
(() => {
  let n = 0;
  for (let c = 2; n < 64; c++) {
    let prime = true;
    for (let d = 2; d * d <= c; d++) if (c % d === 0) { prime = false; break; }
    if (!prime) continue;
    if (n < 8) H0[n] = ((Math.sqrt(c) % 1) * 4294967296) >>> 0;
    K[n] = ((Math.cbrt(c) % 1) * 4294967296) >>> 0;
    n++;
  }
})();

const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
const W = new Uint32Array(64);

export function sha256Bytes(data: Uint8Array): Uint8Array {
  const l = data.length;
  const total = ((l + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(total);
  buf.set(data);
  buf[l] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(total - 8, Math.floor(l / 0x20000000));
  dv.setUint32(total - 4, (l << 3) >>> 0);
  const h = H0.slice();
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = W[i - 15], b = W[i - 2];
      const s0 = rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3);
      const s1 = rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + W[i]) | 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) ov.setUint32(i * 4, h[i]);
  return out;
}

const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
export function sha256HexSync(input: string): string {
  const d = sha256Bytes(new TextEncoder().encode(input));
  let s = "";
  for (let i = 0; i < 32; i++) s += HEX[d[i]];
  return s;
}
