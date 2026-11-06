# Ledger specification (local, simulated)

Type: `local_append_only`. Hash: SHA-256. Payload version: 1.

## Event
`id, eventType, entityId?, sourceRecordIds?, sourceSnapshotId?, translationRecordId?, certificateId?, timestamp, ruleSetVersion?, payload, hashAlgorithm, payloadVersion, previousEventHash, eventHash, ledgerType` (+ optional `externalTransactionHash`, `externalExplorerUrl`, unused until a testnet anchor exists).

## Hash
```
eventHash = SHA-256( canonicalJSON(hashed fields) + "|" + (previousEventHash ?? "GENESIS") )
```
`canonicalJSON`: keys sorted recursively, strings NFC-normalized and trimmed, `undefined` dropped. UI-only fields are never hashed. The hashed field list is `hashableView` in `src/services/ledgerService.ts`.

## Rules
1. Events are appended, never edited. `appendEvent` returns a new array.
2. Corrections, disputes and withdrawals are new events referencing the certificate; displayed status derives from the latest such event, and all history stays visible.
3. The chain is verified from the first event on load (`verifyChain`). A failure is shown as an integrity warning, not as proof of tampering.
4. Seed events come from `scripts/buildLedger.ts` (deterministic). Visitor events live in this browser's localStorage, after the seed.

## What it does and does not establish
It can show an event is unchanged relative to the copy being viewed, and which snapshot and rule version produced it. It cannot show that a source claim is true, that the Office's judgment is fair, or that the whole chain was not rewritten by whoever controls it. It is not decentralized, trustless or independently immutable and must not be described that way.

## Not implemented
Testnet anchoring (spec §8.4), wallets, smart contracts. If added: anchor only a hash, keep records off-chain, show network + transaction hash + explorer link, and state that a transaction confirms only that a hash was submitted.
