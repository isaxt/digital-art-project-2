import { useSyncExternalStore } from "react";
import { seedStore } from "../data";
import type { StoreShape } from "../types/ledger";

/**
 * Seed records (built at build time) + a local, browser-only delta.
 * The delta lives in localStorage and only ever appends. Nothing leaves the visitor's browser.
 */
const KEY = "ocf.store.v1";
const emptyDelta = (): StoreShape => ({ snapshots: {}, translations: [], certificates: [], ledger: [] });

let delta: StoreShape = emptyDelta();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) delta = { ...emptyDelta(), ...(JSON.parse(raw) as Partial<StoreShape>) };
} catch { /* storage unavailable: session-only */ }

let merged: StoreShape | null = null;
const listeners = new Set<() => void>();

function compute(): StoreShape {
  return {
    snapshots: { ...seedStore.snapshots, ...delta.snapshots },
    translations: [...seedStore.translations, ...delta.translations],
    certificates: [...seedStore.certificates, ...delta.certificates],
    ledger: [...seedStore.ledger, ...delta.ledger],
  };
}
export function getStore(): StoreShape { return (merged ??= compute()); }

function commit() {
  merged = null;
  try { localStorage.setItem(KEY, JSON.stringify(delta)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function appendToStore(add: Partial<StoreShape>) {
  delta = {
    snapshots: { ...delta.snapshots, ...(add.snapshots ?? {}) },
    translations: [...delta.translations, ...(add.translations ?? [])],
    certificates: [...delta.certificates, ...(add.certificates ?? [])],
    ledger: [...delta.ledger, ...(add.ledger ?? [])],
  };
  commit();
}
export function localRecordCount(): number { return delta.ledger.length; }
export function resetLocalRecords() { delta = emptyDelta(); commit(); }

export function useStore(): StoreShape {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    getStore,
  );
}
