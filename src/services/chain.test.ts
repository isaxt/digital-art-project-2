import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { entities, ruleSet, seedLedger, seedCertificates } from "./registryService";
import { appendEvent } from "./ledgerService";
import {
  buildBlocks, confirmations, contractOf, entityAddress, isAddress, isBuried, isFinalized, leadingZeros, mineChunk, merkleLevels,
  merkleRoot, powHash, verifyPow, witnessesOf, blockOfEvent, REGISTRAR_ADDRESS, h,
} from "./chainService";
import { canonicalize } from "../utils/canonicalize";
import { sha256HexSync } from "../utils/sha256";
import { sha256Hex } from "../utils/hashing";
import { CONFIG } from "../config";

describe("sync sha256", () => {
  it("matches the FIPS test vectors and node crypto, including multi-block and unicode input", async () => {
    expect(sha256HexSync("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256HexSync("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    for (const s of ["a".repeat(55), "a".repeat(56), "a".repeat(64), "a".repeat(1000), "Iván Argote — P·P·O·W “quoted”"]) {
      expect(sha256HexSync(s)).toBe(createHash("sha256").update(s, "utf8").digest("hex"));
      expect(sha256HexSync(s)).toBe(await sha256Hex(s));
    }
  });
});

describe("addresses and the rules 'contract'", () => {
  it("entity addresses are deterministic, well-formed and unique", () => {
    const addrs = entities.map((e) => entityAddress(e.id));
    expect(new Set(addrs).size).toBe(entities.length);
    for (const a of addrs) expect(isAddress(a)).toBe(true);
    expect(entityAddress("ramp")).toBe(entityAddress("ramp"));
    expect(addrs).not.toContain(REGISTRAR_ADDRESS);
  });
  it("contract address is the hash of the rule set's canonical source", () => {
    const c = contractOf(ruleSet);
    expect(c.hash).toBe(createHash("sha256").update(canonicalize(ruleSet)).digest("hex"));
    expect(c.address).toBe(`0x${c.hash.slice(0, 40)}`);
    const changed = { ...ruleSet, rules: ruleSet.rules.map((r, i) => (i ? r : { ...r, limitation: r.limitation + "!" })) };
    expect(contractOf(changed).address).not.toBe(c.address);
  });
});

describe("merkle tree and blocks", () => {
  it("odd leaves are paired with themselves; root depends on every leaf and on order", () => {
    const [a, b, c] = ["a", "b", "c"].map(h);
    const lv = merkleLevels([a, b, c]);
    expect(lv[1]).toEqual([h(a + b), h(c + c)]);
    expect(lv[2]).toEqual([h(h(a + b) + h(c + c))]);
    expect(merkleRoot([a, b, c])).not.toBe(merkleRoot([a, c, b]));
    expect(merkleRoot([a])).toBe(a);
  });

  it("blocks cover every event once, in order, and link by parent hash", () => {
    const blocks = buildBlocks(seedLedger);
    expect(blocks.flatMap((b) => b.events.map((e) => e.id))).toEqual(seedLedger.map((e) => e.id));
    blocks.forEach((b, i) => {
      expect(b.height).toBe(i);
      expect(b.previousBlockHash).toBe(i ? blocks[i - 1].hash : null);
      expect(b.merkleRoot).toBe(merkleRoot(b.events.map((e) => e.eventHash)));
    });
    expect(blocks.slice(0, -1).every((b) => b.sealed)).toBe(true);
    expect(blockOfEvent(blocks, 20).events).toContain(seedLedger[20]);
  });

  it("is deterministic, and altering one event changes its block and every later block hash", () => {
    const a = buildBlocks(seedLedger);
    expect(buildBlocks(seedLedger).map((b) => b.hash)).toEqual(a.map((b) => b.hash));
    const t = seedLedger.map((e) => ({ ...e }));
    t[20] = { ...t[20], eventHash: "f".repeat(64) };
    const b = buildBlocks(t);
    const k = Math.floor(20 / CONFIG.blockSize);
    expect(b.slice(0, k).map((x) => x.hash)).toEqual(a.slice(0, k).map((x) => x.hash));
    for (let i = k; i < a.length; i++) expect(b[i].hash).not.toBe(a[i].hash);
  });

  it("a partial last block is open, and is sealed once it fills", async () => {
    let chain = [...seedLedger];
    while (chain.length % CONFIG.blockSize !== 1) chain = await appendEvent(chain, { eventType: "record_corrected", timestamp: "2026-11-08T00:00:00Z", payload: {} });
    expect(buildBlocks(chain).at(-1)!.sealed).toBe(false);
    for (let i = 0; i < CONFIG.blockSize - 1; i++) chain = await appendEvent(chain, { eventType: "record_corrected", timestamp: "2026-11-08T00:00:00Z", payload: {} });
    expect(buildBlocks(chain).at(-1)!.sealed).toBe(true);
  });
});

describe("confirmations and witnesses", () => {
  it("confirmations = later events stacked on top; burial threshold", () => {
    expect(confirmations(seedLedger.length, seedLedger.length - 1)).toBe(0);
    expect(confirmations(seedLedger.length, seedLedger.length - 7)).toBe(6);
    expect(isBuried(5)).toBe(false);
    expect(isBuried(6)).toBe(true);
  });

  it("a witness event adds a confirmation to everything beneath it", async () => {
    const cert = seedCertificates[0];
    const idx = seedLedger.findIndex((e) => e.id === cert.ledgerEventId);
    const before = confirmations(seedLedger.length, idx);
    const next = await appendEvent(seedLedger, { eventType: "certificate_witnessed", entityId: cert.entityId, certificateId: cert.id, timestamp: "2026-11-08T00:00:00Z", payload: { witness: "0x" + "1".repeat(40) } });
    expect(confirmations(next.length, idx)).toBe(before + 1);
  });

  it("counts distinct witnesses only, and finalizes at the quorum", async () => {
    const cert = seedCertificates[0];
    let chain = [...seedLedger];
    const w = (n: number) => "0x" + String(n).repeat(40);
    for (const who of [w(1), w(1), w(2)])
      chain = await appendEvent(chain, { eventType: "certificate_witnessed", entityId: cert.entityId, certificateId: cert.id, timestamp: "2026-11-08T00:00:00Z", payload: { witness: who } });
    expect(witnessesOf(chain, cert.id)).toEqual([w(1), w(2)]);
    expect(isFinalized(2)).toBe(false);
    expect(isFinalized(CONFIG.quorum)).toBe(true);
    expect(witnessesOf(seedLedger, cert.id)).toEqual([]);
  });
});

describe("proof of work", () => {
  it("finds a valid nonce, verifies it, and rejects tampering", () => {
    let p = null as ReturnType<typeof mineChunk> | null;
    do p = mineChunk("CERT-TEST", "ab".repeat(32), 3, p, 50); while (!p.found);
    const pow = p.found!;
    expect(pow.hash).toBe(powHash("CERT-TEST", pow.head, pow.nonce));
    expect(leadingZeros(pow.hash)).toBeGreaterThanOrEqual(3);
    expect(verifyPow("CERT-TEST", pow)).toBe(true);
    expect(verifyPow("CERT-OTHER", pow)).toBe(false);
    expect(verifyPow("CERT-TEST", { ...pow, nonce: pow.nonce + 1 })).toBe(false);
    expect(verifyPow("CERT-TEST", { ...pow, difficulty: 8 })).toBe(false);
  });
});
