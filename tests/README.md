# Tests

These suites target the extension's Flarum 2.x dependencies.

## Run

Install the Composer and frontend dependencies first. The development dependencies
include flarum/gdpr for integration testing; it is not a runtime requirement. From the js directory,
build the bundles with npm run build -- --no-output-clean.

Backend tests use Flarum's isolated testing installation. On the first run,
configure a **dedicated test database** with the testing package's environment
variables and run composer test:setup. That command recreates the database;
never point it at a real forum. Reuse the same FLARUM_TEST_TMP_DIR_LOCAL (or
FLARUM_TEST_TMP_DIR) for subsequent runs.

From the extension root:

~~~sh
composer test
~~~

From js:

~~~sh
npm test -- --runInBand
npm test -- --runInBand --coverage --collectCoverageFrom="src/**/*.{ts,tsx}"
npm run check-typings
~~~

The schema suite requires pdo_sqlite. The API suite uses the database configured
by Flarum's testing setup. Locale and asset tests compile actual Flarum
forum/admin assets inside that installation.

## Coverage

| Suite | Behavior |
| --- | --- |
| GdprTest | Real GDPR registration, translated descriptions, ZIP export, complete/chunked ownership export, deduplication, erasure jobs, scoped anonymization/deletion, timestamp preservation |
| GdprAvailabilityTest | Forum/admin boot and personal API with GDPR disabled or absent from an isolated Composer inventory; absent-package test blocks all GDPR class loading |
| ThreadmarkSchemaTest | Migration seeds/rollback, uniqueness across owners and types, deletion constraints, preserved post locations |
| PersonalMarksApiTest | Personal CRUD, owner isolation including administrators, default/nested relationships, permission revocation, invalid inputs, disabled types, hidden/deleted targets |
| DiscussionMarksApiTest | Author/moderator permissions, public relationships, administrative endpoints, duplicate handling, disabled types, post/note validation, tombstone navigation |
| TypeManagementApiTest | Admin CRUD, required fields, default status, used-type deletion protection, sorting and malformed orders |
| FrontendAssetsTest | Actual forum/admin HTTP boot, Less compilation, frontend locale namespaces and resolved references |
| manageModal.test.tsx | Shared type caching, scopes, native keyboard behavior, first/hidden/event posts, previews, known post IDs, save/delete success and failure |
| directory.test.tsx | Scope filters, body-mounted window, focus/Escape, native mobile dropdown/backdrop, viewport changes, cleanup |
| adminTypes.test.tsx | Table/Switch behavior, pending requests and rollback, sorting, create/edit/delete forms and previews |
| streamNavigation.test.tsx | Combined ordering, body deduplication, lazy loading batches, filtered/normal/deleted navigation |
| postIntegration.test.tsx | Scrubber clustering, inline labels, deletion refresh and failure handling |
| streamExtenders.test.tsx | Core extender registration, position restoration, navigation races, tombstone windows, jump highlighting |
| localeCatalogues.test.tsx | Locale key parity, references, interpolation/plurals, accessible labels and escaped content |

## Harness boundaries

- Flarum's SQLite integration harness disables foreign keys before its rollback
  transaction. API tests explicitly arrange the resulting tombstone state;
  the separate in-memory schema suite verifies the actual foreign-key actions
  with enforcement enabled.
- The testing extension manager registers locale callbacks after enabling the
  extension. The shared fixture refreshes LocaleManager after boot so the tests
  exercise the registered translations.
- Jest mounts Mithril components and loads Bootstrap's real dropdown plugin.
  Browser layout, pointer behavior, and responsive styling still need a browser
  smoke test; JavaScript assertions do not replace those checks.
- The extension uses TypeScript 5.x (currently locked to 5.9.3) and
  typescript-coverage-report 1.x. Flarum's build tool keeps its own TypeScript
  4.9 dependency. The extension uses @types/dom-close-watcher for the declaration missing
  from TypeScript 5.x's DOM types; runtime support remains feature-detected.

