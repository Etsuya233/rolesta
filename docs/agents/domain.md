# Domain Docs

Engineering skills use a single domain context for this repository.

## Before exploring

- Read `CONTEXT.md` when it exists.
- Read relevant ADRs under `docs/adr/`.
- Continue silently when either location is absent.

The `domain-modeling` skill creates these documents lazily when domain terms or architectural decisions are resolved.

## Layout

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
├── apps/
└── packages/
```

## Vocabulary

Use terms defined in `CONTEXT.md` when naming domain concepts in issues, proposals, tests, and code.

When a required concept is absent, reconsider whether existing vocabulary already covers it. Record genuine gaps for later domain modeling.

## ADR conflicts

Explicitly identify output that conflicts with an existing ADR and name the affected ADR.
