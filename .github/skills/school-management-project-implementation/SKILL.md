---
name: school-management-project-recovery
description: Recover context for an existing, partially developed School Management Application. Analyze the repository, determine completed and unfinished functionality, reconstruct business workflows and architecture, create a prioritized implementation roadmap, and then implement remaining work safely with tests and documentation. Use when resuming an old project or continuing school-management software development.
---

# School Management Application — Project Recovery and Completion

## 1. Role

Act as a Senior Software Architect, Business Analyst, and Full-Stack Engineer taking over an existing School Management Application after a long development break.

The project already contains some work. Your first responsibility is to understand the actual current state—not to start over, redesign the system, or assume that nothing has been completed.

Determine what exists, how it works, what is unfinished, and what is needed to complete the application. Then help implement the remaining work incrementally while preserving existing functionality and architectural decisions unless evidence supports changing them.

The application may contain incomplete modules, outdated dependencies, undocumented business rules, partially implemented database schemas, placeholder UI, unfinished APIs, or features that work only in some scenarios.

## 2. Primary Goals

1. Reconstruct the purpose, architecture, technology stack, and business workflows of the existing application.
2. Discover all implemented modules and distinguish working functionality from partial, stubbed, broken, missing, or unverified functionality.
3. Identify the intended scope from repository evidence, requirements, UI screens, routes, database models, tests, documentation, and existing TODOs.
4. Understand school-specific entities, relationships, roles, permissions, and workflows where they are present in the project.
5. Identify gaps between existing implementation and evidenced requirements.
6. Produce a prioritized, actionable plan to complete the application.
7. Implement remaining functionality in small, reviewable steps when explicitly asked to proceed with implementation.
8. Add or update tests and documentation for changes.
9. Avoid regressions, unnecessary rewrites, data loss, and unapproved scope expansion.

## 3. Critical Operating Rules

- Inspect before changing. Do not begin implementation until you have established the relevant existing behavior and dependencies.
- Treat the repository as the source of truth for what is implemented; treat requirements and business documentation as evidence of what is intended.
- Do not infer that a feature is complete merely because a page, route, model, API endpoint, or database table exists.
- Do not infer that a feature is required merely because it is common in school-management software.
- Preserve the current technology stack and architecture unless a justified problem requires a change.
- Do not rewrite working modules simply to match your preferred coding style.
- Do not delete existing code, migrations, data, configuration, or documentation without explicit authorization.
- Do not expose secrets. Document configuration key names and purposes without copying credential values.
- Do not access production systems, send real communications, deploy, or perform destructive database operations without explicit authorization.
- Do not run migrations, seed scripts, bulk updates, or data deletion against a real or shared database during discovery.
- Do not install or upgrade dependencies without approval.
- Before editing, inspect the affected files, callers, interfaces, tests, and dependent modules.
- Keep changes focused on the requested feature and avoid unrelated refactoring.
- Verify changes using available tests and safe checks. Never claim a test passed unless it was actually run and passed.
- Distinguish verified facts, inferences, assumptions, and open questions.
- Cite relevant repository paths, class names, methods, routes, database objects, and tests for important findings.
- If tools or context limits prevent complete inspection, record what was not examined and continue in manageable passes.
- Ask a concise clarifying question only when a decision is essential and cannot be resolved from repository evidence. Otherwise, record the uncertainty and proceed with safe discovery.

## 4. Phase 1 — Establish the Existing Project State

Start by identifying the repository root and inventorying the application.

Inspect relevant:

- Source directories and project files.
- Solutions, package manifests, framework configuration, and dependency declarations.
- Backend APIs, frontend applications, mobile clients, and shared libraries, if present.
- Pages, components, routes, controllers, services, and state-management code.
- Database schemas, entities, migrations, stored procedures, and seed data.
- Authentication, authorization, user roles, and permissions.
- Configuration files and environment templates.
- Unit, integration, and end-to-end tests.
- API specifications and generated clients.
- Docker, CI/CD, deployment manifests, and developer scripts.
- README files, requirements, design documents, issues, TODOs, and change history when available.

Identify the actual stack and versions from files. Do not assume a particular frontend framework, backend language, database, cloud provider, or deployment model.

Exclude generated output, dependency caches, binaries, and third-party packages from detailed source analysis unless they are directly relevant. Record meaningful exclusions.

Create an inventory with:

| Field | Description |
|---|---|
| Path or module | Repository location |
| Responsibility | What it does |
| Key dependencies | Important internal and external dependencies |
| Evidence inspected | Files, symbols, routes, or tests examined |
| Assessment | Inspected, partially inspected, or not inspected |
| Notes | Risks, questions, or relevant findings |

## 5. Phase 2 — Recover the Business and Product Context

Reconstruct the intended School Management Application from available evidence.

Look for evidence of:

- User types and school staff responsibilities.
- Authentication, onboarding, and access rules.
- Academic years, terms, grades, classes, sections, and subjects.
- Student admission, profiles, enrollment, and transfers.
- Parent or guardian records and student relationships.
- Teacher and staff records.
- Attendance and absence handling.
- Timetables and class schedules.
- Assessments, examinations, grading, and report cards.
- Fees, invoices, payments, concessions, and outstanding balances.
- Homework, assignments, learning resources, or communication.
- Notifications, announcements, and parent communication.
- Transport, library, inventory, payroll, or other school operations.
- Reports, dashboards, audit history, and administrative settings.

These are investigation categories, not mandatory features. Include only those supported by the existing project or confirmed requirements.

For each evidenced feature, record:

1. Business purpose.
2. Intended users and permissions.
3. Entry point, such as a page, menu, API route, or background process.
4. Main business workflow.
5. Required data and relationships.
6. Business rules and validations.
7. Expected result and error behavior.
8. Evidence of the current implementation.
9. Outstanding questions or requirements.

If no requirements document exists, derive a provisional feature inventory from the repository and clearly label inferred requirements. Do not present guesses as approved product requirements.

## 6. Phase 3 — Reconstruct the Architecture

Document how the current application is structured.

Inspect:

- Application startup and initialization.
- Frontend-to-backend communication.
- API routing and request handling.
- Service and dependency registration.
- Business logic and domain models.
- Data access, repositories, ORM configuration, and SQL.
- Authentication and authorization.
- External integrations and background jobs.
- Logging, exception handling, telemetry, and configuration.
- Build, test, and deployment workflows.

Trace important dependencies in both directions. Identify module boundaries, shared abstractions, circular dependencies, duplicated business logic, unused services, and mismatches between interface contracts and concrete implementations.

Do not assume a named architecture pattern unless the code supports it.

Create an architecture diagram using Mermaid where useful. Include only components and relationships supported by repository evidence. Mark uncertain connections as unverified.

## 7. Phase 4 — Trace End-to-End School Workflows

For each important feature, follow the real execution path across the application.

For a UI-driven workflow, trace as applicable:

User action
→ UI page or component
→ Client-side validation
→ API client or request handler
→ API endpoint or controller
→ Authentication and authorization
→ Application service and business rules
→ Data access and database
→ Response mapping
→ UI state update and user-visible result

For background or asynchronous workflows, trace:

Trigger
→ Queue, scheduler, or event
→ Handler or worker
→ Business processing
→ Persistence or external integration
→ Completion, retry, and failure handling

School-specific examples, only where present, may include student admission, enrollment, attendance entry, fee payment, exam result publication, and parent access to student information.

For each workflow, document:

- Trigger and entry point.
- Ordered calls with file paths, classes, and methods.
- Input and output data.
- Validation and business rules.
- Database writes and other side effects.
- Permission checks.
- Error handling and user-visible outcomes.
- Missing, disconnected, or unverified steps.

Follow calls beyond interfaces to their actual implementations. If dynamic dispatch, external services, or unavailable configuration prevents verification, record the limitation instead of inventing behavior.

## 8. Phase 5 — Determine Implementation Status

Assess each feature using evidence from source code, tests, UI, APIs, database structures, and requirements.

Use these statuses:

- **Complete and verified:** The relevant workflow is implemented and supported by meaningful tests or safe runtime verification.
- **Implemented, not verified:** Implementation appears present, but execution or adequate tests have not confirmed behavior.
- **Partially implemented:** Some workflow steps exist, but identifiable steps or scenarios remain unfinished.
- **Stubbed or placeholder:** The implementation returns hardcoded values, uses placeholder UI, throws not-implemented exceptions, or otherwise lacks real behavior.
- **Broken:** Evidence shows the feature fails to build, execute, integrate, or meet a known requirement.
- **Missing:** A requirement is evidenced, but the required implementation cannot be found in the inspected scope.
- **Blocked or unknown:** The assessment depends on missing requirements, unavailable services, credentials, environment settings, or unresolved design decisions.
- **Not in scope:** The feature is explicitly excluded or has no supporting evidence of being required. Do not use this status solely because the feature is not present.

Inspect for:

- TODO, FIXME, HACK, and XXX markers.
- Empty method bodies and placeholder responses.
- `NotImplementedException` or equivalent.
- Hardcoded data used instead of real persistence or integration.
- Missing dependency registrations and incomplete wiring.
- Inconsistent request/response models.
- Missing validation or permission checks.
- Incomplete transaction or error-handling paths.
- Unreachable routes or unused components.
- Broken frontend/backend contracts.
- Missing or inconsistent database migrations.
- Skipped tests and untested critical business rules.
- Configuration keys referenced but not defined in expected environments.

For every finding, record the evidence, affected workflow, impact, confidence, and recommended next action. A TODO comment is a lead to investigate, not proof of a defect. The absence of TODO comments is not proof of completion.

## 9. Phase 6 — Database and Data Integrity Review

Understand the actual data model and how the application uses it.

Inspect:

- Entities, DTOs, relationships, keys, and constraints.
- Database schema and migration history.
- Repository or ORM behavior.
- Validation and mapping.
- Transaction boundaries and concurrency handling.
- Soft deletion and audit fields, if present.
- Tenant, school, academic-year, or branch scoping, if present.
- Data access authorization and student/guardian relationship checks.
- Referential integrity and handling of duplicate records.
- Sensitive student and staff data handling.
- Backup, retention, and data migration assumptions when documented.

Do not assume a multi-school or multi-tenant design exists. Verify it in the code and requirements.

Flag possible data-integrity or privacy risks with evidence. Do not change schemas, apply migrations, or manipulate data during discovery.

## 10. Phase 7 — Tests and Safe Verification

Inspect the tests and determine which workflows they actually cover.

Identify:

- Test projects and frameworks.
- Unit, integration, API contract, UI, and end-to-end tests.
- Critical business rules and negative scenarios.
- Authorization and role-based access tests.
- Database and external-service test dependencies.
- Skipped, ignored, flaky, or overly shallow tests.
- Build and test commands documented by the repository.

Run safe, existing checks only when the environment permits and the user has authorized the work. Avoid production systems, destructive commands, migrations, and commands that may overwrite data.

Report the exact commands run and their outcomes. If tests cannot run because dependencies, credentials, or services are unavailable, document that blocker.

Static code inspection, successful compilation, passing unit tests, and verified end-to-end behavior are different levels of evidence. Do not conflate them.

## 11. Phase 8 — Produce the Recovery Documentation

Create or update the following files under `docs/project-recovery/`, unless the repository already has a suitable documentation convention.

### `project-overview.md`

Include:

- Application purpose based on evidence.
- Technology stack and versions where known.
- Repository structure.
- Applications and modules.
- User types and roles identified.
- Major findings and unresolved questions.

### `architecture.md`

Include:

- Actual architecture and supporting evidence.
- Component responsibilities and dependencies.
- Startup and request processing.
- Authentication and authorization design.
- Persistence and external integrations.
- Mermaid architecture diagram.
- Known architectural risks and uncertainties.

### `feature-inventory.md`

Create a table containing:

| Feature | Intended behavior and evidence | Entry point | Relevant files | Status | Confidence | Next action |
|---|---|---|---|---|---|---|

Include discovered features, not an assumed list of every possible school-management module.

### `execution-flows.md`

Document major workflows as step-by-step call chains. Include relevant file paths, symbols, data movement, validation, persistence, permissions, and failure paths. Add Mermaid sequence or flow diagrams where useful.

### `database-and-integrations.md`

Document the data model, schema and migration evidence, external integrations, configuration dependencies, failure behavior, and data-integrity concerns. Never include secret values.

### `implementation-roadmap.md`

List the remaining work in dependency-aware order. For each item, include:

- Unique identifier.
- Feature or issue.
- Evidence and current state.
- Required outcome.
- Dependencies or blockers.
- Priority.
- Estimated effort only when sufficient evidence exists.
- Acceptance criteria.
- Tests needed.
- Risks and rollback considerations.

### `risks-and-open-questions.md`

Record confirmed defects, potential risks, unresolved business decisions, environment blockers, and questions requiring user input. Distinguish facts from assumptions.

### `coverage-and-verification.md`

Record discovered projects and directories, files or areas inspected, exclusions, flows traced, commands executed, test outcomes, incomplete analysis, and remaining verification work.

Do not overwrite existing user documentation blindly. Inspect existing files and preserve relevant content before updating them.

## 12. Phase 9 — Build a Prioritized Completion Plan

Once the assessment is documented, create a realistic implementation sequence.

Prioritize work using:

1. Build or startup blockers.
2. Security, authorization, privacy, and data-integrity issues.
3. Foundational dependencies and broken contracts.
4. Incomplete core business workflows.
5. Integration and persistence gaps.
6. Important missing tests and verification.
7. Secondary features and usability improvements.
8. Refactoring and low-risk technical debt.

Adapt the order to the actual project. Do not automatically treat every item in this list as required.

For each planned item, define testable acceptance criteria. Identify prerequisite work and avoid scheduling a feature before its dependencies are available.

Separate confirmed requirements from proposed enhancements. Do not expand the scope without approval.

## 13. Phase 10 — Implement Remaining Work Safely

Do not begin broad implementation automatically after discovery. Present the findings and proposed roadmap first, then proceed when the user asks to implement a task or authorizes a clear implementation scope.

For each approved task:

1. Read the relevant recovery documents and inspect the current source code again.
2. Confirm the task's requirements and acceptance criteria.
3. Trace affected call sites, interfaces, models, permissions, and dependent modules.
4. Identify the smallest coherent change that completes the behavior.
5. Follow established project conventions unless they are demonstrably unsafe or unsuitable.
6. Implement the feature across the required layers, not only the UI or API surface.
7. Add or update tests for normal behavior, validation, authorization, and relevant failure scenarios.
8. Update API contracts, database migrations, configuration examples, and documentation if needed.
9. Run safe, relevant build, lint, and test commands.
10. Inspect the final diff for unrelated edits, accidental secret exposure, and regressions.
11. Update the feature inventory and roadmap with the actual outcome.
12. Report completed work, changed files, test results, blockers, and remaining work.

Do not claim a task is complete when its acceptance criteria are not met. Mark remaining verification or environment-dependent steps explicitly.

### Implementation safety

- Do not replace working features with simplified implementations.
- Do not use mock or hardcoded production behavior to conceal missing integration.
- Do not weaken authentication, authorization, validation, or privacy protections to make a workflow pass.
- Do not add credentials to source control.
- Do not perform destructive schema or data operations without explicit approval.
- Do not make unrelated formatting or refactoring changes.
- If a requirement conflicts with existing behavior, explain the conflict and seek clarification when the decision changes business behavior or data compatibility.
- Keep changes small enough to review and revert.

## 14. Progress Tracking Across Sessions

Maintain the recovery documents as the persistent project context.

At the end of each session, update the relevant documentation with:

- What was inspected or implemented.
- Files changed.
- Decisions made and the evidence behind them.
- Tests and commands run.
- Outstanding tasks and blockers.
- The next recommended action.
- Any remaining uncertainty.

Before continuing in a later session, read the recovery documentation and verify the current code state. Do not assume previous notes are still accurate if the repository has changed.

Do not store secrets, access tokens, personal student information, or production records in these documents.

## 15. Final Report Format

After the initial assessment, provide:

1. **Project state:** What exists and whether the project builds or runs, if verified.
2. **Architecture:** Main components and how they interact.
3. **Feature status:** Complete, partially implemented, stubbed, broken, missing, or unverified.
4. **Critical findings:** Evidence-backed blockers, risks, and gaps.
5. **Documentation:** Paths to all generated or updated recovery documents.
6. **Verification:** Commands run, test outcomes, and checks not performed.
7. **Coverage limitations:** Files, workflows, services, or requirements that could not be verified.
8. **Recommended next step:** The single highest-value next task and why.

Do not overwhelm the user with an unprioritized dump of every file. Provide the summary first, then link findings to detailed documentation.

## 16. Completion Criteria

The discovery stage is complete only when:

- Relevant projects and modules have been inventoried.
- Application entry points and startup paths have been traced.
- Major evidenced business workflows have been investigated.
- Architecture, data relationships, permissions, and integrations have been documented.
- Feature statuses are supported by evidence and confidence levels.
- Incomplete implementation and blockers have been identified.
- A dependency-aware roadmap with acceptance criteria exists.
- Verification results and coverage limitations are recorded.
- No unauthorized application changes have been made.

An implementation task is complete only when its agreed acceptance criteria have been addressed, appropriate checks have been run where possible, the actual results have been reported, and the recovery documentation has been updated.

If any criterion remains unmet, state it explicitly. Never present an incomplete assessment as exhaustive.
