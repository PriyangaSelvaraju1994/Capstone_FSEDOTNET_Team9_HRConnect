# HRConnect System Architecture

## Overview

HRConnect is a web-based Employee and Leave Management System designed to manage employee information, leave requests, leave balances, and organizational holidays.

The system follows a layered architecture pattern to ensure separation of concerns, maintainability, and scalability.

## High-Level Architecture

```text
+--------------------+
|      Frontend      |
|  React Application |
+---------+----------+
          |
          | HTTP / HTTPS
          |
+---------v----------+
|   ASP.NET Core API |
+---------+----------+
          |
          |
+---------v----------+
|     Services       |
| Business Logic     |
+---------+----------+
          |
          |
+---------v----------+
|   Repositories     |
| Data Access Layer  |
+---------+----------+
          |
          |
+---------v----------+
|    SQL Server      |
|     Database       |
+--------------------+
```

## Architecture Layers

### Presentation Layer

Responsible for:

- User Interface
- API Consumption
- Form Validation
- User Interactions

Technology:
- React
- Axios

---

### API Layer

Responsible for:

- Request Handling
- Authentication
- Authorization
- Response Formatting

Technology:
- ASP.NET Core Web API

---

### Service Layer

Responsible for:

- Business Rules
- Leave Calculations
- Employee Approval Logic
- Validation

Examples:

- EmployeeService
- LeaveService
- HolidayService

---

### Repository Layer

Responsible for:

- Database Operations
- CRUD Operations
- Query Execution

Examples:

- EmployeeRepository
- LeaveRepository
- HolidayRepository

---

### Database Layer

Responsible for:

- Data Persistence
- Referential Integrity
- Transaction Management

Technology:
- SQL Server

## Authentication Flow

```text
User Login
    |
    v
API Validates Credentials
    |
    v
Generate JWT Token
    |
    v
Return Token
    |
    v
Frontend Stores Token
    |
    v
Authenticated Requests
```

## Employee Registration Workflow

```text
User Registration
      |
      v
Employee Record Created
(Status = Inactive)
      |
      v
Admin Reviews Employee
      |
      v
Approve Employee
      |
      v
Status = Active
      |
      v
User Can Login
```

## Leave Request Workflow

```text
Employee Applies Leave
          |
          v
Leave Request Created
          |
          v
Admin Reviews Request
          |
          +----------------+
          |                |
          v                v
      Approve          Reject
          |
          v
Update Leave Balance
```

## Non-Functional Requirements

### Security

- JWT Authentication
- Password Hashing
- Role-Based Authorization

### Performance

- Entity Framework Query Optimization
- Pagination for Employee Listings

### Scalability

- Layered Architecture
- Dependency Injection
- Repository Pattern

## Future Enhancements

- Audit Logging
- Reporting Dashboard
- MCP integration using AI to track