# Deployment readiness and multi-tenant database governance

## 1. Core model

The application keeps a monolithic service layer but introduces a tenant-aware operating model:

- master registry database holds tenant records and provisioning metadata
- per-school tenant databases are resolved via the tenant slug and database name in the registry
- all tenant-scoped requests are validated via the `X-Tenant-Slug` header and tenant authorization rules

This keeps the application deployable without a full rewrite while enabling multi-school onboarding and isolation.

## 2. Environment configuration

Use environment variables or a deployment secret store instead of embedding local database values in code.

Required values:

- `POSTGRES_CONNECTION_STRING` for the master database connection string
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` as deployment-friendly overrides
- `JWT_KEY`, `JWT_ISSUER`, `JWT_AUDIENCE`
- `FRONTEND_ALLOWED_ORIGIN`

The backend resolves connection strings in this order:

1. `POSTGRES_CONNECTION_STRING`
2. `DB_HOST` + `DB_PORT` + `DB_NAME` + `DB_USER` + `DB_PASSWORD`
3. configured appsettings connection string

## 3. Recommended tenant lifecycle

1. Register tenant in the registry
2. Validate tenant slug and database name
3. Provision school database metadata
4. Set status to `Pending`
5. On successful provisioning, move to `Active` only after admin confirmation or validation
6. If provisioning fails, mark as `ProvisionFailed` and allow retry
7. `Suspended` tenants are excluded from active lookup and request processing

## 4. Operational notes

- Do not rely on `localhost` in production; use private network routing or managed Postgres endpoints.
- Keep the master database separate from tenant school databases.
- Treat `X-Tenant-Slug` as an identity boundary and reject any mismatched tenant request.
- Use a dedicated admin/operator workflow for tenant activation and retries.

## 5. Safe startup sequence

1. Start Postgres or managed database service
2. Export environment variables or load `.env`
3. Run migrations for the master registry database
4. Start the backend
5. Validate health and tenant APIs
6. Start the frontend and verify the app loads

## 6. Next stage

The next production-oriented step is to create a proper admin console or operational API for:

- creating a tenant
- retrying failed provisioning
- viewing pending/failed tenants
- activating and suspending schools
- reviewing database assignment and lifecycle history
