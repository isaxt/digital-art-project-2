# Earlier build (parked)

These files were in the project folder before the current build started. They were moved here
unchanged, nothing was deleted. Some files from the same earlier build (package.json, tsconfig,
the types, utils, styles, pages, and the entities/sources/events/rules JSON) were overwritten
before this was noticed and are NOT recoverable from here.

`scripts/seedData.mjs` is the one-off generator that produced the earlier JSON dataset
(13 entities, marked "seeded from recollection, not machine-retrieved"). Re-running it would
regenerate that data. `src/core/` and `tests/core.test.ts` are the earlier engine/ledger and tests.
