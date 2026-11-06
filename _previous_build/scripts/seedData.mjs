// One-off generator for the curated seed JSON in src/data. The JSON files are the source of truth
// afterwards; edit them directly or re-run ingestion. Kept in scripts/ for transparency.
import { writeFileSync } from "node:fs";
const BASE = Date.parse("2026-11-05T12:00:00.000Z");
const T = (i) => new Date(BASE + i * 60_000).toISOString();
const RET = "2026-11-05";
const seeded = {
  acquisition: "seeded_unretrieved",
  verificationStatus: "needs_review",
  retrievedAt: RET,
  reuseNotes:
    "Seeded from the builder's recollection of public record, NOT machine-retrieved. Facts and dates must be verified against sourceUrl before publication. No third-party text or images are reproduced.",
};

const E = (n, type, name, description, tags, aff = [], extra = {}) => ({
  id: `OCF-E-${String(n).padStart(4, "0")}`, entityType: type, displayName: name, description,
  sourceRecordIds: [`OCF-SRC-${String(n).padStart(3, "0")}`], affiliationIds: aff, eventIds: [],
  createdAt: T(n), updatedAt: T(n), verificationStatus: "needs_review", tags, ...extra,
});

const id = (n) => `OCF-E-${String(n).padStart(4, "0")}`;
const entities = [
  E(1, "artist", "Kerry James Marshall", "American painter, born 1955 in Birmingham, Alabama; based in Chicago.", ["painting", "museum-recognized"], [id(8)],
    { selectionNote: "Long museum exhibition record plus gallery representation: rich input for the exhibition and backing rules." }),
  E(2, "artist", "Kara Walker", "American artist known for room-scale cut-paper silhouette work and large site-specific commissions.", ["installation", "commissions"], [],
    { selectionNote: "Public-commission and fellowship history rather than a market record; one event does not map to any rule." }),
  E(3, "artist", "Julie Mehretu", "Ethiopian-born American painter working in large-scale abstract compositions.", ["painting"], [id(10)],
    { selectionNote: "Retrospective plus gallery representation; contrasts with Walker's commission-led record." }),
  E(4, "artist", "Mark Bradford", "American artist based in Los Angeles working in large-scale abstract painting and social practice.", ["painting", "social-practice"], [id(9)],
    { selectionNote: "National-pavilion presentation and gallery representation." }),
  E(5, "startup", "Airbnb", "Online marketplace for short-term lodging and experiences. Participated in Y Combinator's Winter 2009 batch.", ["marketplace", "yc", "public-company"], [id(12)],
    { selectionNote: "Startup with an accelerator, a reported funding round and a later public listing: the fullest startup record in the seed set." }),
  E(6, "startup", "Dropbox", "File storage and sync company. Participated in Y Combinator's Summer 2007 batch.", ["software", "yc", "public-company"], [id(12)],
    { selectionNote: "Accelerator and public listing, but no funding round recorded here; shows missing data handled neutrally." }),
  E(7, "startup", "Reddit", "Online discussion platform founded in 2005. Participated in Y Combinator's Summer 2005 batch.", ["platform", "yc"], [id(12)],
    { selectionNote: "Early accelerator-era company whose recorded events are an acquisition and a later listing, neither of which is a funding round." }),
  E(8, "institution", "David Zwirner", "International commercial art gallery.", ["gallery"], []),
  E(9, "institution", "Hauser & Wirth", "International commercial art gallery.", ["gallery"], []),
  E(10, "institution", "Marian Goodman Gallery", "International commercial art gallery.", ["gallery"], []),
  E(11, "institution", "Art Institute of Chicago", "Art museum in Chicago whose collection data is available through a public API (planned first ingestion source).", ["museum", "api-source"], [],
    { selectionNote: "Included as an entity the translation rules deliberately cannot map: an institution is neither an artist nor a startup." }),
  E(12, "institution", "Y Combinator", "Startup accelerator.", ["accelerator"], []),
  E(13, "artist", "Untitled Practice (Fixture A)", "FICTIONAL TEST FIXTURE. An invented artist record with almost no public information.", ["fixture", "sparse"], [],
    { isFixture: true, selectionNote: "Fictional. Tests sparse records: only a statement exists, so most rules report insufficient data." }),
  E(14, "startup", "Pitchdeck Labs (Fixture B)", "FICTIONAL TEST FIXTURE. An invented startup with a pitch and nothing independently verifiable.", ["fixture", "pitch-only"], [],
    { isFixture: true, selectionNote: "Fictional. Tests a strong pitch with no verifiable events; the Office must not infer traction from marketing language." }),
];

const S = (n, provider, url, title, fields, extra = {}) => ({
  id: `OCF-SRC-${String(n).padStart(3, "0")}`, entityId: id(n), provider, sourceUrl: url, sourceTitle: title,
  normalizedFields: fields, ...seeded, ...extra,
});
const wiki = (slug) => `https://en.wikipedia.org/wiki/${slug}`;
const yc = (slug) => `https://www.ycombinator.com/companies/${slug}`;
const sources = [
  S(1, "Wikipedia (provisional pointer)", wiki("Kerry_James_Marshall"), "Kerry James Marshall", { summary: "Painter, b. 1955 Birmingham, Alabama; Chicago." }),
  S(2, "Wikipedia (provisional pointer)", wiki("Kara_Walker"), "Kara Walker", { summary: "Artist; cut-paper silhouettes and site-specific commissions." }),
  S(3, "Wikipedia (provisional pointer)", wiki("Julie_Mehretu"), "Julie Mehretu", { summary: "Painter; large-scale abstraction." }),
  S(4, "Wikipedia (provisional pointer)", wiki("Mark_Bradford_(artist)"), "Mark Bradford", { summary: "Artist; abstract painting and social practice; Los Angeles." }),
  S(5, "Y Combinator company directory (provisional pointer)", yc("airbnb"), "Airbnb at Y Combinator", { summary: "Lodging marketplace; YC W09." }),
  S(6, "Y Combinator company directory (provisional pointer)", yc("dropbox"), "Dropbox at Y Combinator", { summary: "File storage and sync; YC S07." }),
  S(7, "Y Combinator company directory (provisional pointer)", yc("reddit"), "Reddit at Y Combinator", { summary: "Discussion platform; YC S05." }),
  S(8, "Institution website", "https://www.davidzwirner.com", "David Zwirner", { summary: "Commercial gallery." }),
  S(9, "Institution website", "https://www.hauserwirth.com", "Hauser & Wirth", { summary: "Commercial gallery." }),
  S(10, "Institution website", "https://www.mariangoodman.com", "Marian Goodman Gallery", { summary: "Commercial gallery." }),
  S(11, "Art Institute of Chicago API documentation", "https://api.artic.edu/docs/", "Art Institute of Chicago", { summary: "Museum; public collection API." }),
  S(12, "Institution website", "https://www.ycombinator.com", "Y Combinator", { summary: "Startup accelerator." }),
  S(13, "Office fixture (fictional)", "https://example.invalid/fixture-a", "Fixture A statement",
    { statement: "My practice is a long-term inquiry into how small gestures accumulate into shared memory." },
    { acquisition: "fixture", reuseNotes: "Invented by the Office for testing. Not a real person.", verificationStatus: "needs_review" }),
  S(14, "Office fixture (fictional)", "https://example.invalid/fixture-b", "Fixture B pitch",
    { pitch: "We are building the operating system for the future of attention." },
    { acquisition: "fixture", reuseNotes: "Invented by the Office for testing. Not a real company.", verificationStatus: "needs_review" }),
];

let evN = 0;
const V = (entity, eventType, title, originalEventType, date, description) => ({
  id: `OCF-EV-${String(++evN).padStart(4, "0")}`, entityId: id(entity), eventType, title,
  ...(description ? { description } : {}), ...(date ? { date } : {}),
  sourceRecordId: `OCF-SRC-${String(entity).padStart(3, "0")}`, originalEventType,
});
const events = [
  V(1, "exhibition", "Mastry (survey exhibition), Museum of Contemporary Art Chicago", "retrospective exhibition", "2016"),
  V(1, "gallery_representation", "Represented by David Zwirner", "gallery representation"),
  V(2, "exhibition", "A Subtlety, or the Marvelous Sugar Baby (Creative Time commission, Brooklyn)", "site-specific commission", "2014"),
  V(2, "exhibition", "Fons Americanus (Hyundai Commission, Tate Modern Turbine Hall)", "commission", "2019"),
  V(2, "other", "MacArthur Fellowship", "fellowship", "1997"),
  V(3, "exhibition", "Mid-career retrospective organized by the Los Angeles County Museum of Art", "retrospective exhibition", "2019"),
  V(3, "gallery_representation", "Represented by Marian Goodman Gallery", "gallery representation"),
  V(4, "exhibition", "Tomorrow Is Another Day (US Pavilion, 57th Venice Biennale)", "national pavilion", "2017"),
  V(4, "gallery_representation", "Represented by Hauser & Wirth", "gallery representation"),
  V(5, "accelerator", "Y Combinator, Winter 2009 batch", "accelerator batch", "2009"),
  V(5, "funding_round", "Series A (reported lead: Sequoia Capital; amount not recorded here)", "venture round (reported)", "2009"),
  V(5, "public_announcement", "Initial public offering", "public listing", "2020-12"),
  V(6, "accelerator", "Y Combinator, Summer 2007 batch", "accelerator batch", "2007"),
  V(6, "public_announcement", "Initial public offering", "public listing", "2018-03"),
  V(7, "accelerator", "Y Combinator, Summer 2005 batch", "accelerator batch", "2005"),
  V(7, "public_announcement", "Acquired by Condé Nast", "acquisition announcement", "2006-10"),
  V(7, "public_announcement", "Initial public offering", "public listing", "2024-03"),
];
for (const ev of events) {
  const ent = entities.find((e) => e.id === ev.entityId);
  ent.eventIds.push(ev.id);
}

const mk = (rule) => ({ version: "1.0", enabled: true, ...rule });
const ruleSet = {
  ruleSetVersion: "OCF-RS-1.0",
  rules: [
    mk({ id: "ART_EXHIBITION_TO_TRACTION", sourceEntityType: "artist", targetVocabulary: "startup", inputFields: ["events.exhibition"], outputLabel: "Institutional traction event",
      description: "An exhibition is reframed as a public visibility milestone.", rationale: "Both events can signal recognition within a relevant network.",
      limitation: "An exhibition does not demonstrate market demand or commercial traction.", template: "Traction event: “{title}”[ ({date})]. Public visibility milestone within an institutional network.",
      missingMessage: "No exhibition records included in this dataset.", confidence: "interpretive_mapping" }),
    mk({ id: "ART_GALLERY_TO_BACKING", sourceEntityType: "artist", targetVocabulary: "startup", inputFields: ["events.gallery_representation"], outputLabel: "Institutional backing",
      description: "Gallery representation is reframed as institutional backing.", rationale: "In both cases an established organization formally associates itself with the entity's future work.",
      limitation: "Representation is a commercial relationship, not an equity investment; terms are usually private.", template: "Institutional backing: {title}[ ({date})].",
      missingMessage: "Gallery representation not recorded in selected sources.", confidence: "direct_mapping" }),
    mk({ id: "ART_ACQUISITION_TO_ADOPTION", sourceEntityType: "artist", targetVocabulary: "startup", inputFields: ["events.acquisition"], outputLabel: "Institutional adoption event",
      description: "A collection acquisition is reframed as an adoption by a major institutional customer.", rationale: "Both mark an established body choosing to hold or use the work.",
      limitation: "A museum acquisition is stewardship, not procurement, and carries no revenue meaning.", template: "Adoption event: {title}[ ({date})].",
      missingMessage: "No acquisition records included in this dataset.", confidence: "interpretive_mapping" }),
    mk({ id: "ART_RESIDENCY_TO_INCUBATION", sourceEntityType: "artist", targetVocabulary: "startup", inputFields: ["events.residency"], outputLabel: "Incubation period",
      description: "A residency is reframed as an incubation period.", rationale: "Both provide time, space and a peer network ahead of public output.",
      limitation: "Residencies rarely have the equity, milestone or cohort-exit logic of incubators.", template: "Incubation period: {title}[ ({date})].",
      missingMessage: "No residency records included in this dataset.", confidence: "interpretive_mapping" }),
    mk({ id: "ART_STATEMENT_TO_THESIS", sourceEntityType: "artist", targetVocabulary: "startup", inputFields: ["source.statement"], outputLabel: "Product / market thesis",
      description: "An artist statement describing a long-term inquiry is reframed as a product or market thesis.", rationale: "Both articulate a durable question that organizes future work.",
      limitation: "An inquiry is not a market; the source text is quoted unchanged and only its framing is translated.", template: "Thesis candidate (source text quoted verbatim): “{text}”",
      missingMessage: "No source statement available.", confidence: "interpretive_mapping" }),
    mk({ id: "STARTUP_FUNDING_TO_PATRONAGE", sourceEntityType: "startup", targetVocabulary: "art_world", inputFields: ["events.funding_round"], outputLabel: "Financial patronage event",
      description: "A funding round is reframed through the language of patronage.", rationale: "Both involve external financial support for a proposed future.",
      limitation: "Venture investment is not equivalent to artistic patronage.", template: "Patronage event: {title}[ ({date})].",
      missingMessage: "Funding history not available in selected sources.", confidence: "interpretive_mapping" }),
    mk({ id: "STARTUP_ACCELERATOR_TO_NETWORK", sourceEntityType: "startup", targetVocabulary: "art_world", inputFields: ["events.accelerator"], outputLabel: "Network validation",
      description: "Joining an accelerator is reframed as network validation, comparable to a residency or a selected group exhibition.", rationale: "Both are selective cohort memberships conferring peers, mentors and visibility.",
      limitation: "Accelerators take equity and expect growth; art residencies generally do neither.", template: "Network validation: {title}[ ({date})].",
      missingMessage: "Accelerator participation not recorded in selected sources.", confidence: "direct_mapping" }),
    mk({ id: "STARTUP_LAUNCH_TO_PREMIERE", sourceEntityType: "startup", targetVocabulary: "art_world", inputFields: ["events.product_launch"], outputLabel: "Public premiere",
      description: "A product launch is reframed as a premiere.", rationale: "Both are the moment unseen work first meets a public.",
      limitation: "A launch is repeatable and iterative; a premiere is a singular event.", template: "Premiere: {title}[ ({date})].",
      missingMessage: "No product launch records included in this dataset.", confidence: "interpretive_mapping" }),
    mk({ id: "STARTUP_PARTNERSHIP_TO_COLLABORATION", sourceEntityType: "startup", targetVocabulary: "art_world", inputFields: ["events.partnership"], outputLabel: "Institutional collaboration",
      description: "A partnership is reframed as an institutional collaboration.", rationale: "Both pair the entity with an established organization for a defined effort.",
      limitation: "Commercial partnerships often carry exclusivity and revenue terms with no curatorial analogue.", template: "Collaboration: {title}[ ({date})].",
      missingMessage: "No partnership records included in this dataset.", confidence: "interpretive_mapping" }),
    mk({ id: "STARTUP_ANNOUNCEMENT_TO_BULLETIN", sourceEntityType: "startup", targetVocabulary: "art_world", inputFields: ["events.public_announcement"], outputLabel: "Institutional bulletin",
      description: "A public announcement (listing, acquisition, press release) is reframed as an institutional bulletin.", rationale: "Both are formal statements that change how an entity is publicly described.",
      limitation: "Listings and acquisitions are financing and ownership events, not forms of recognition.", template: "Bulletin: {title}[ ({date})].",
      missingMessage: "No public announcements included in this dataset.", confidence: "interpretive_mapping" }),
    mk({ id: "STARTUP_PITCH_TO_PROPOSITION", sourceEntityType: "startup", targetVocabulary: "art_world", inputFields: ["source.pitch"], outputLabel: "Curatorial proposition",
      description: "A pitch describing a future product vision is reframed as a curatorial proposition.", rationale: "Both ask an audience to imagine and back something that does not yet exist.",
      limitation: "Pitch language is promotional; it is not evidence of funding, revenue or traction and none is inferred.", template: "Curatorial proposition (source text quoted verbatim): “{text}”",
      missingMessage: "No source pitch available.", confidence: "interpretive_mapping" }),
  ],
};

const w = (f, d) => writeFileSync(new URL(`../src/data/${f}`, import.meta.url), JSON.stringify(d, null, 2) + "\n");
w("entities.json", entities); w("sources.json", sources); w("events.json", events); w("rules.json", ruleSet);
console.log(entities.length, "entities", sources.length, "sources", events.length, "events", ruleSet.rules.length, "rules");
