export type EntityType = "artist" | "startup" | "institution" | "project" | "other";

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
}
