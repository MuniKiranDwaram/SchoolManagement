# School Management System - Design Document

## 1. System overview
The School Management System is designed to support administrative work for a school, with primary responsibilities in student records, teacher records, attendance-like academic management, and financing-related operations. The design emphasizes a simple, modular dashboard interface that can be expanded with more modules over time.

## 2. Stakeholders and primary use cases
### Primary users
- School administrator
- Academic staff
- Front desk or operations staff

### Core use cases
- Log in to the system
- Register a user account
- Add, update, search, and delete teacher records
- Add, update, search, and delete student records
- View dashboard overview
- Manage billing information
- Manage exam results
- Track events and holidays

## 3. Functional design by module
### 3.1 Authentication module
The authentication module is the entry point into the application.

Responsibilities:
- Register a user
- Log in a user
- Validate credentials
- Generate and issue authentication token or cookie
- Protect administrative routes

Current implementation:
- [Frontend/src/Components/Login/Login.jsx](../Frontend/src/Components/Login/Login.jsx)
- [Frontend/src/Server.js](../Frontend/src/Server.js)
- [Backend/Backend/Controllers/AuthenticationController.cs](../Backend/Backend/Controllers/AuthenticationController.cs)

### 3.2 Teacher management module
This module handles academic staff records.

Teacher domain properties include:
- TeacherID
- Name
- Designation
- Subject
- Class
- DOB
- DOJ
- Email
- Phone
- Salary
- Address

The design pattern is a form-driven CRUD process:
- Add teacher through form
- Search teacher by name
- Update teacher details
- Delete teacher record by ID

### 3.3 Student management module
Student management is intended to follow the same CRUD pattern as Teacher management but is partially implemented.

Student domain properties include:
- RollNo
- Name
- Description
- FatherName
- MotherName
- Class
- FatherOccupation
- Caste
- DOB
- DOJ
- Email
- ParentPhoneNumber
- Address
- TotalFee

Current implementation includes the model and routes, but the backend controller and some data operations are still only partially built.

### 3.4 Dashboard and navigation module
The application uses a left sidebar and nested routes to organize major screens.

Navigation categories include:
- Dashboard
- Teachers
- Students/Classes
- Billing
- Exams
- Events/Holidays

This is implemented in [Frontend/src/App.jsx](../Frontend/src/App.jsx) and [Frontend/src/Components/Sidebar/Sidebar.jsx](../Frontend/src/Components/Sidebar/Sidebar.jsx).

## 4. Data model design
### 4.1 User entity
```csharp
public class User
{
    public string Id { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
}
```

Purpose:
- Stores account credentials used for login and registration

### 4.2 Teacher entity
```csharp
public class Teacher
{
    public int TeacherID { get; set; }
    public string Name { get; set; }
    public string Designation { get; set; }
    public string Subject { get; set; }
    public int Class { get; set; }
    public DateOnly DOB { get; set; }
    public DateOnly DOJ { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
    public string Salary { get; set; }
    public string Address { get; set; }
}
```

### 4.3 Student entity
```csharp
public class Student
{
    public int RollNo { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string FatherName { get; set; }
    public string MotherName { get; set; }
    public int Class { get; set; }
    public string FatherOccupation { get; set; }
    public string Caste { get; set; }
    public DateOnly DOB { get; set; }
    public DateOnly DOJ { get; set; }
    public string Email { get; set; }
    public string ParentPhoneNumber { get; set; }
    public string Address { get; set; }
    public string TotalFee { get; set; }
}
```

### 4.4 Database context
The current database structure is defined in [Backend/Backend/Data/AppDbContext.cs](../Backend/Backend/Data/AppDbContext.cs).

The design uses the following tables conceptually:
- Users
- Teachers
- Students

## 5. API design
### 5.1 Authentication endpoints
- POST /api/authentication/login
- POST /api/authentication/register

Request payload:
```json
{
  "email": "admin@school.com",
  "password": "P@ssw0rd"
}
```

### 5.2 Teacher endpoints
- POST /teacher/addTeacher?addType={Add|Update}
- GET /teacher/searchTeacher?teacher={name}
- PUT /teacher/updateTeacher

### 5.3 User-oriented endpoints
- DELETE /{entryRole}/{name}/{ID}
- GET /student/{name}/{role}

These routes exist in [Backend/Backend/Controllers/UserController.cs](../Backend/Backend/Controllers/UserController.cs), but several branches are commented out or incomplete.

## 6. Frontend state design
The frontend uses Redux Toolkit for specific local state management.

Current Redux slice:
- [Frontend/src/Redux/Slices/AddTeacherSlice.js](../Frontend/src/Redux/Slices/AddTeacherSlice.js)

This slice stores teacher form values including:
- name
- designation
- class
- subject
- date of birth
- date of joining
- salary
- address
- phone
- email

This is a simple application-state design that supports form persistence while the user navigates through the feature flow.

## 7. UX and interaction design
### Layout
The application uses a two-column shell:
- fixed sidebar on the left
- content area on the right

This structure supports the administrative dashboard pattern and keeps navigation visible at all times.

### Interaction model
Each major feature uses a route-driven workflow:
1. User selects module from sidebar
2. Feature page loads in content region
3. User enters or searches data
4. Frontend calls API
5. Backend persists or returns record data
6. UI updates or displays result message

## 8. Security design
The current security design is a basic starting point:

- Password hashing via Identity PasswordHasher
- JWT generation for authenticated sessions
- Cookie storage for JWT
- CORS policy for React app origin

However, there are important gaps:
- JWT secret configuration is missing from app settings
- Authorization middleware is not enforced for protected routes
- Request validation and role checks are not yet implemented comprehensively

## 9. Quality attributes and design tradeoffs
### Strengths
- Quick to develop
- Easy to understand
- Well-suited for a demo or academic project
- Feature grouping is logical for a school admin app

### Tradeoffs
- Tight coupling between UI and backend business rules
- No service layer abstraction yet
- Minimal validation and error-handling consistency
- Limited student and billing lifecycle implementation

## 10. Target-state design
A more mature design should include:

1. Layered architecture
   - Presentation
   - Application services
   - Domain models
   - Data access/repositories

2. Strong authentication and authorization
   - Role-based access control
   - Protected routes
   - Token validation on all sensitive endpoints

3. Business model expansion
   - Admission records
   - Fee tracking with payment status
   - Attendance and marks management
   - Events scheduling and announcements

4. Testing strategy
   - Unit tests for services and validation logic
   - Integration tests for API endpoints
   - UI tests for admin flows

## 11. Conclusion
The current solution is best characterized as a modular, prototype-grade school management platform. It has a sensible feature breakdown, a usable dashboard structure, and the foundational patterns needed for a real application. The design is intentionally simple and approachable, but it will require stronger layering, validation, and security controls before it is ready for production or broad deployment.
