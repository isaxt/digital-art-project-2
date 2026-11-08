export type EntityType = "artist" | "startup" | "gallery" | "institution" | "project" | "other";

export type VerificationStatus = "verified" | "partially_verified" | "needs_review";

export interface Entity {
  id: string;
  entityType: EntityType;
  displayName: string;
  alternateNames?: string[];
  description?: string;
  /** The source record that supplied `description`. Source facts keep their provenance. */
  descriptionSourceRecordId?: string;

  sourceRecordIds: string[];
  affiliationIds: string[];
  eventIds: string[];

  createdAt: string;
  updatedAt: string;

  verificationStatus: VerificationStatus;
  tags?: string[];

  /** Original record id in the supplied dataset (kept even when `id` had to be disambiguated). */
  datasetRecordId?: string;
  /** Which supplied dataset the record came from. */
  dataset?: "galleries" | "startups" | "derived_from_galleries";
  /** Classification as written in the supplied dataset (e.g. contemporary_gallery). */
  category?: string;
  location?: { city: string; state?: string; country: string };
  sector?: string[];
  /** null = none recorded in the dataset (NOT proof there was none). */
  accelerator?: string | null;
  batch?: string | null;
  /** The dataset's own status fields, verbatim (e.g. artist_roster: "not_yet_parsed"). */
  datasetStatus?: Record<string, string>;
  /** Notes from the supplied dataset, verbatim. */
  sourceNotes?: string[];
  /** Researcher's selection / interpretation notes (shown on Methods and entity pages). */
  selectionNote?: string;
}

export type EventType =
  | "exhibition"
  | "acquisition"
  | "gallery_representation"
  | "residency"
  | "funding_round"
  | "accelerator"
  | "product_launch"
  | "partnership"
  | "public_announcement"
  | "other";

export interface EntityEvent {
  id: string;
  entityId: string;
  /** Application-level category (a normalization, not a claim of equivalence). */
  eventType: EventType;
  title: string;
  description?: string;
  date?: string;
  sourceRecordId: string;
  /** How the source itself described the event. */
  originalEventType: string;
  endDate?: string;
  venue?: string;
  /** Names exactly as listed by the source for this event. */
  participants?: string[];
}
