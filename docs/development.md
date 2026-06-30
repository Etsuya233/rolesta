# Development Notes

## Boundaries

- API controllers handle HTTP concerns only.
- API services handle business rules and orchestration.
- API repositories handle Kysely database access.
- Web route components compose feature components.
- Web feature API files call typed API helpers.
- Web query hooks own TanStack Query usage.
- Web form schemas live outside rendering components.
- UI primitives are reused before adding new local style fragments.

## Database

SQLite is the default database for the first skeleton. Keep queryable data in normal columns and store compatibility snapshots as text JSON. Repository implementations should use portable Kysely queries unless a measured need requires a database-specific override.

## OpenAPI

The API exports `apps/api/openapi.json`. The web app generates TypeScript API types from that document into `apps/web/src/lib/api/generated/schema.ts`.
