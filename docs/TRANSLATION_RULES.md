# Translation rules (rule set 1.0.0)

Rules live in `src/data/rules.json`. The engine (`src/services/translationService.ts`) is pure and deterministic: same snapshot + rule set, same output. No AI, clocks or randomness.

Each rule has: stable ID, version, what it reads, what it produces, description, rationale, limitation, a template, a confidence label (`direct_mapping`, `interpretive_mapping`; `insufficient_data` is produced by the engine when input is absent), and a missing-input message.

| Rule | Direction | Reads | Produces |
|---|---|---|---|
| ART_EXHIBITION_TO_TRACTION | artist → startup | events.exhibition | Cultural traction event |
| ART_GALLERY_TO_BACKING | artist → startup | events.gallery_representation | Institutional backing |
| ART_ACQUISITION_TO_ADOPTION | artist → startup | events.acquisition | Institutional adoption event |
| ART_RESIDENCY_TO_INCUBATION | artist → startup | events.residency | Incubation period |
| ART_STATEMENT_TO_THESIS | artist → startup | source field `statement` | Product / market thesis |
| STARTUP_FUNDING_TO_PATRONAGE | startup → art world | events.funding_round | Financial patronage event |
| STARTUP_ACCELERATOR_TO_NETWORK | startup → art world | events.accelerator | Network validation |
| STARTUP_LAUNCH_TO_PREMIERE | startup → art world | events.product_launch | Public premiere |
| STARTUP_PITCH_TO_PROPOSITION | startup → art world | source field `pitch` | Curatorial proposition |

The first six spec examples map to the rules above; ACQUISITION, RESIDENCY and LAUNCH are additions.

## Behaviour that matters

- **Missing input** becomes `insufficient_data` with the rule's message (e.g. "Funding history not available in selected sources."). It is never turned into a low score.
- **Unmapped facts** (events no rule reads) are listed as "where the analogy breaks".
- **Wrong entity type** for a direction is declined, with an explanation. Institutions have no direction.
- **Classification** (`OCF-C3/C2/C0`) counts how many slots the rules could fill. It describes record readability, not merit, and `C0` reads "insufficient mapped data (no inference drawn)".
- Text rules quote the source in a fixed template; they do not summarize or invent.

## Changing rules

Edit `rules.json`, bump `version` on the rule and the rule set. Certificates issued under an earlier version keep that version, because the certificate ID includes the rule-set version and snapshot.
