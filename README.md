# HRConnect

HRConnect is an Employee and Leave Management System designed to streamline employee administration, leave tracking, approvals, and holiday management within an organization.

## Features

- Employee Registration
- Employee Approval Workflow
- JWT Authentication & Authorization
- Employee Management
- Leave Balance Management
- Leave Application & Tracking
- Leave Approval Workflow
- Holiday Management
- Role-Based Access Control
- Swagger API Documentation

## Technology Stack

### Frontend
- React (Planned/In Progress)

### Backend
- ASP.NET Core Web API
- Entity Framework Core
- SQL Server

### Authentication
- JWT Bearer Authentication

## Project Structure

```text
HRConnect
│
├── Backend
│   ├── HRConnect.API
│   ├── Controllers
│   ├── Services
│   ├── Repositories
│   ├── Models
│   ├── DTOs
│   └── Migrations
│
└── Docs
    ├── Architecture
    ├── API Specifications
    └── Project Documents
```

## User Workflow

### Registration

1. User registers.
2. Employee record is created with Inactive status.
3. Admin reviews the registration.
4. Admin approves the employee.
5. Employee becomes Active and can access the application.

### Leave Management

1. Employee submits leave request.
2. Admin reviews request.
3. Leave balance is updated after approval.

## Documentation

See the [Docs](./Docs/README.md) folder for detailed documentation.

## Contributors

- Priyanga Selvaraju
- HRConnect Team

## License

This project is intended for educational and demonstration purposes.
