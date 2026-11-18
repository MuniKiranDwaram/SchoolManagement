# School Management Application — Prioritized Implementation Roadmap

## 1. Objective
This roadmap is intended to recover and complete the School Management Application without disrupting the working foundation already present in the repository. The priority is to stabilize the current system, close the most damaging gaps, and then complete the school administration workflows in a safe sequence.

## 2. Implementation principles
- Preserve existing working functionality in the current frontend and backend.
- Do not rewrite working modules simply to match preferred patterns.
- Fix missing or broken infrastructure before broader feature work.
- Add validation and tests around critical flows.
- Use a small, reviewable sequence of pull requests or commits.

## 3. Priority matrix

| Priority | Workstream | Why it matters | Target status |
|---|---|---|---|
| P0 | Authentication and authorization foundation | Security and route protection are currently incomplete | Must be fixed before broader feature completion |
| P1 | Student lifecycle completion | Student module is the largest missing functional area | Core student CRUD and search |
| P1 | Teacher workflow hardening | Teacher flows are the primary working module but still inconsistent | Reliable add/update/delete/search |
| P2 | Data integrity and validation | Prevent runtime failures and invalid records | Consistent models and safe database operations |
| P2 | Frontend/backend contract cleanup | Prevent mismatched API usage and route drift | Stable client-server contract |
| P3 | Billing, exams, and event modules | User-facing features exist in navigation but remain incomplete | Module-level business flows |
| P3 | Test coverage and CI | No existing automated validation | Basic unit/integration tests |

## 4. Phase-by-phase roadmap

### Phase 1 — Stabilize the application foundation (highest priority)

#### Task 1: Fix the broken auth and security foundation
Scope:
- Implement a valid JWT configuration in application settings.
- Ensure login registration flows are consistent and return predictable results.
- Protect routes that should require authentication.
- Decide and enforce user roles from the existing enum model.

Evidence:
- [Backend/Backend/Controllers/AuthenticationController.cs](../Backend/Backend/Controllers/AuthenticationController.cs)
- [Backend/Backend/Enumeartions/AppEnumerations.cs](../Backend/Backend/Enumeartions/AppEnumerations.cs)
- [Backend/Backend/appsettings.json](../Backend/Backend/appsettings.json)

Acceptance criteria:
- A user can register and log in successfully.
- A valid JWT is issued and attached consistently.
- Protected endpoints reject unauthenticated access.
- Role-based access check is enforced for teacher/admin/student routes.
- The login flow works with a controlled response model, not ad hoc strings.

#### Task 2: Remove placeholder cross-cutting logic
Scope:
- Replace or delete broken middleware/filter implementations that throw NotImplementedException.
- Add real request validation and security checks only where required.

Evidence:
- [Backend/Backend/Filters/CustomFilter1.cs](../Backend/Backend/Filters/CustomFilter1.cs)
- [Backend/Backend/Middlewares/UserExistMiddleware.cs](../Backend/Backend/Middlewares/UserExistMiddleware.cs)

Acceptance criteria:
- No endpoint depends on a filter or middleware that throws NotImplementedException.
- Request validation and user checks are explicit and predictable.
- Security layer does not break normal application flows.

### Phase 2 — Complete the student lifecycle

#### Task 3: Implement StudentController and adapter logic
Scope:
- Add student create, update, delete, and search endpoints.
- Map UI form fields to entity properties and validate required values.
- Ensure student search works from the frontend interface.

Evidence:
- [Backend/Backend/Controllers/StudentController.cs](../Backend/Backend/Controllers/StudentController.cs)
- [Backend/Backend/Models/Student.cs](../Backend/Backend/Models/Student.cs)
- [Frontend/src/Components/StudentComponents](../Frontend/src/Components/StudentComponents)

Acceptance criteria:
- A student can be added successfully with required validation.
- Student records can be searched and retrieved by relevant identifiers.
- Update and delete flows behave consistently.
- Student UI is wired to real backend API responses.

### Phase 3 — Harden the teacher workflow

#### Task 4: Fix teacher add/update/delete/search reliability
Scope:
- Replace unsafe `First()` assumptions with null-safe patterns.
- Implement proper update semantics instead of remove-and-readd behavior.
- Ensure frontend and backend error responses are consistent.

Evidence:
- [Backend/Backend/Controllers/TeacherController.cs](../Backend/Backend/Controllers/TeacherController.cs)
- [Frontend/src/Components/Teacher/SearchTeacherDetails/SearchTeacher.jsx](../Frontend/src/Components/Teacher/SearchTeacherDetails/SearchTeacher.jsx)
- [Frontend/src/Components/Teacher/AddTeacher/AddTeacher.jsx](../Frontend/src/Components/Teacher/AddTeacher/AddTeacher.jsx)

Acceptance criteria:
- Duplicate teacher registration is rejected with a proper API response.
- Update operation changes only intended records.
- Delete operation works and returns consistent success/failure messages.
- Search response contract is stable for the frontend.

### Phase 4 — Strengthen data model and validation

#### Task 5: Normalize the domain model and validation rules
Scope:
- Replace string-based numeric fields with correct types where appropriate.
- Add validation for required data, email format, phone format, and date fields.
- Add explicit DTO layer for API requests/responses.

Evidence:
- [Backend/Backend/Models/Teacher.cs](../Backend/Backend/Models/Teacher.cs)
- [Backend/Backend/Models/Student.cs](../Backend/Backend/Models/Student.cs)
- [Backend/Backend/DTO/UserLogin.cs](../Backend/Backend/DTO/UserLogin.cs)

Acceptance criteria:
- Invalid records are rejected before persistence.
- API input and output are strongly typed and consistent.
- Type safety is improved without breaking current features.

### Phase 5 — Complete remaining modules

#### Task 6: Implement billing, exams, and events flows
Scope:
- Define clear business operations for each module.
- Add backend endpoints and UI-driven workflows.
- Hook module screens to real data operations.

Acceptance criteria:
- Each module has a clear CRUD or business-action flow.
- User-facing screens reflect actual backend data.
- Validation and error handling are consistent with the rest of the app.

### Phase 6 — Testing and release readiness

#### Task 7: Add automated verification
Scope:
- Add unit tests for auth, teacher, and student services.
- Add integration tests for API endpoints.
- Add frontend smoke checks for the main navigation flows.

Acceptance criteria:
- Core flows are covered by automated tests.
- Test command(s) run successfully in CI or local environment.
- Security-sensitive flows are tested with negative cases.

## 5. Recommended immediate next task
The highest-priority next task is to stabilize the authentication and authorization foundation before completing any additional module work.

Why this is the right next step:
- The security model is currently incomplete despite the existence of role enums.
- The app cannot be trusted without protected routes and verified identity flows.
- The student and teacher features depend on the backend being predictable and secure.
- Fixing this first prevents rework across all downstream modules.

### Immediate next milestone
Implement a safe auth hardening pass:
- define/configure JWT settings
- validate registration/login flow
- enforce a simple authenticated route guard
- add role checks for teacher/admin/student access
- document and test the flow

This is the highest leverage action because it removes the biggest risk and creates the foundation for all remaining school-management workflows.

## 6. Suggested delivery order
1. Security foundation and route protection
2. Student API and UI completion
3. Teacher reliability fixes
4. Validation and data model cleanup
5. Billing/exams/events modules
6. Automated tests and release readiness

## 7. Acceptance summary
The project can be considered recovered when:
- authentication and authorization work end-to-end
- teacher and student modules are complete and consistent
- database operations are safe and validated
- module navigation is connected to real business endpoints
- negative scenarios are tested
- the application is ready for next-stage deployment and usage
