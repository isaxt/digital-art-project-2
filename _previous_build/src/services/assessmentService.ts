import { createAssessment, type AssessmentResult } from "../core/assessment";
import { dataset } from "../data";
import type { Direction } from "../types/translation";
import { appendToStore, getStore } from "./store";

/** Explicit user action: "Record translation and issue certificate". Idempotent. */
export async function issueAssessment(entityId: string, direction: Direction): Promise<AssessmentResult> {
  const store = getStore();
  const r = await createAssessment(dataset, store, entityId, direction, new Date().toISOString());
  if (r.created && r.snapshot && r.translation && r.certificate) {
    appendToStore({
      snapshots: r.newSnapshot ? { [r.snapshot.id]: r.snapshot } : {},
      translations: r.newTranslation ? [r.translation] : [],
      certificates: [r.certificate],
      ledger: r.newEvents,
    });
  }
  return r;
}
