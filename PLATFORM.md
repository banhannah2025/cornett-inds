# Blended Works platform

Blended Works is a shared product platform. Each application is built once and can run in three workspace modes:

- `internal`: live Blended Works operations
- `demo`: resettable synthetic data for sales demonstrations
- `client`: a client workspace created from a product template

## Core model

Clerk provides user identity and verified email addresses. Blended Works owns workspace assignment and tenancy in the application data model. Every future persisted business record must include an immutable `workspaceId`; authentication context alone is not a substitute for a database tenant filter.

Products, workspaces, templates, access grants, and integration definitions live in `packages/platform`. Apps consume that catalog instead of maintaining separate hard-coded lists.

## Clerk setup

1. Copy each app's `.env.example` to `.env.local` inside that app.
2. Add the same Clerk publishable and secret keys to the Blended Works site and each product app.
3. Leave Clerk Organizations disabled, or configure Organization membership as optional. Required membership creates a `choose-organization` session task and is not part of the Blended Works login flow.
4. Add platform-owner emails to `BLENDED_WORKS_ADMIN_EMAILS` as a comma-separated list.

Business Composer's public demo remains available without authentication. Routes under `/internal` are reserved for authenticated internal tooling and are protected by Clerk middleware.

## Adding a product

1. Add the product app under `apps/`.
2. Add one record to `packages/platform/src/products.ts`.
3. Add its templates to `templates.ts`.
4. Enable it for the appropriate workspaces in `workspaces.ts`.
5. Add its deployment URL environment variable to the Blended Works site.

## Client provisioning (next phase)

Client workspaces will be persisted rather than checked into the static catalog. Provisioning should create a workspace record, user access grants, template-derived module settings, and isolated integration credentials in one server-side workflow.
