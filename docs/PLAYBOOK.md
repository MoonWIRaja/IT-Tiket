# IT-Tiket Product Playbook

## 1. Goal

Deliver a complete, production-capable IT support platform for employees and the IT team. The target is a usable finished system, not an MVP or a demo-only application. Work may be delivered in reviewable increments; each increment must fit the complete product design and remain usable locally.

### Product surfaces

- Desktop-first web application using JavaScript and Next.js.
- Flutter client using the same Supabase backend and authorization rules.
- Local development and testing first; later publish source and CI through GitHub and run the hosted backend on Supabase.
- GitHub is the code and automation host. It is not the runtime for a server-rendered Next.js application; select a compatible web runtime host before production deployment. GitHub Pages is suitable only if the web build is static.
- No Rust service is planned. Use Supabase PostgreSQL, Auth, Storage, Realtime and Edge Functions for backend capabilities.

### Roles

- **Employee (`karyawan`)**: create tickets, see own tickets, exchange public messages, attach allowed files, participate in ticket calls, confirm resolution or reopen within the configured window.
- **IT technician (`it`)**: triage, assign and update tickets, reply, use internal notes, manage resolution and participate in calls.
- **Executive (`atasan`)**: read aggregate operational reports by default; no ticket content or attachment access by default.
- **Administrator (`admin`)**: manage accounts, roles, active state, categories, SLA and system configuration. Sensitive actions are audited. Executive access does not imply admin access.

All authorization is enforced by PostgreSQL RLS and server-side functions, not by hiding UI controls. Keep secrets and service-role credentials server-side.

## 2. Steps in Order

This is a full-system delivery sequence. Each checkpoint is locally testable and reviewable; completion of a checkpoint does not reduce or replace the final scope.

1. **Foundation and identity** — local Supabase, web shell, sign-in/session lifecycle, profiles, roles, permissions, bootstrap of the first administrator and audit events.
2. **Ticket operations** — employee intake, unique ticket number, categories, priority, assignment, status lifecycle, SLA timestamps, employee and IT workspaces, search and filters.
3. **Conversation and files** — public ticket messages, private IT notes, realtime updates, unread state, secure attachment upload/download and retention rules.
4. **Email integration and notifications** — inbound email creates or updates tickets with deduplication and sender verification; outbound status and message notifications. Select the provider and allowed sender/domain policy before enabling production email.
5. **Administration and reporting** — user/role management, department/category/SLA configuration, monthly aggregates, exports, audit review and executive dashboard.
6. **Calls and knowledge** — ticket-scoped audio calls, expiring participant authorization, call history, no recording by default; knowledge articles and searchable help content.
7. **Flutter client** — authentication, employee ticket lifecycle, messages, attachment handling and call participation using the same backend policies as web.
8. **Production readiness** — accessibility, responsive behavior, security review, backups/restore procedure, monitoring, rate limits, error handling, data retention, migration/rollback plan, CI, deployment and operator documentation.

After each checkpoint, keep the repository runnable locally and integrate before expanding the next area. The system is done only when all agreed capabilities are implemented, security and recovery checks pass, and the deployed version can be operated and maintained.

## 3. Rules

- Preserve the existing canonical schema and RLS model in `supabase/migrations/`; change it only through a new migration and review its effect on all clients.
- Keep `docs/backend.md` aligned with schema, policies, bootstrap and local commands.
- Keep one source of truth for role and permission semantics across web, Flutter, SQL and documentation.
- Do not grant executives broad ticket access by default. Escalated access must be explicit, audited and revocable.
- Internal notes, private attachments, sender-verification fields, call recording paths and admin actions must never leak to employees or executives without an explicit permission.
- Email content and attachments are untrusted input. Do not execute or render active HTML; validate sender and attachments, deduplicate deliveries, and never accept privileged account actions from email alone.
- Calls are ticket-scoped and not recorded by default. Any recording feature needs an explicit consent and retention policy.
- Use migrations and reproducible local fixtures. Do not place production data or credentials in seed files or Git.
- Protect Supabase service-role keys and provider credentials. Browser clients may use only publishable/anonymous credentials with RLS enabled.
- Apply accessibility and keyboard support to every web and Flutter workflow; provide clear loading, empty, success and error states.
- Preserve a functional local environment. Cloud deployment is a later environment promotion, not a substitute for local repeatability.
- Keep architecture modular but avoid splitting into separate services unless measured product requirements justify it.

### Team ownership and integration

- **Luna (architecture)**: own this playbook and cross-client architecture decisions; review boundaries and integration risks.
- **Gos (backend/DevOps)**: own Supabase backend, migrations, local stack and deployment automation.
- **Kid (full-stack)**: own web application implementation and shared client behavior.
- **Gok (security/QA)**: own authorization threat review, RLS probes and security acceptance checks.
- **Gim (research/documentation)**: own product documentation, operational guide and research-backed decisions.

Agents should work on distinct files or modules, report changes and verification evidence, and integrate against the shared schema. The founder, MoonWiRaja, owns product decisions that affect scope, business policy or external accounts.

### Open decisions to resolve before the affected integration

- Email provider, support mailbox, inbound sender/domain policy, and identity/SSO provider.
- Whether CEO/executive users need any individually granted ticket access beyond aggregate reports.
- Call scope (audio only versus video/screen share), provider/TURN deployment and consent policy if recording is later requested.
- Ticket categories, SLA targets, reopening window, retention period, employee directory source and expected scale.
- Production web runtime host and deployment domain.

Use secure, reversible defaults until each decision is made; do not invent vendor accounts or credentials.

## 4. What Done Looks Like

- Employee, IT, executive and admin journeys work end-to-end on desktop web; Flutter implements the agreed employee and IT journeys against the same backend.
- Ticket creation, assignment, status transitions, SLA, chat, internal notes, secure files, notifications, email threading, calls, knowledge articles, reports, administration and audit history work as specified.
- RLS and API checks prove employees cannot access another employee's ticket, message, attachment or call; executives see aggregates only unless separately granted; inactive accounts lose access; internal notes remain private.
- Local setup, migrations, seed data, environment configuration and CI are documented and reproducible.
- Security, accessibility, error handling, backup/restore and operational procedures are reviewed; no secrets or test-only shortcuts ship to production.
- Production deployment is reachable on the approved domain, with monitoring and rollback procedures, after the founder approves external account and deployment choices.
