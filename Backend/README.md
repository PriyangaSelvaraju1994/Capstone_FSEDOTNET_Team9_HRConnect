# HRConnect Backend

Backend services for HRConnect built using ASP.NET Core Web API and Entity Framework Core.

## Architecture

The backend follows a layered architecture:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Entity Framework Core
    ↓
SQL Server
```

## Technologies

- ASP.NET Core 8 Web API
- Entity Framework Core
- SQL Server
- JWT Authentication
- Swagger/OpenAPI

## Project Structure

```text
HRConnect.API
│
├── Controllers
├── Services
│   ├── Interfaces
│   └── Implementations
│
├── Repositories
│   ├── Interfaces
│   └── Implementations
│
├── DTOs
├── Models
├── Data
├── Middleware
├── Migrations
└── Utilities
```

## Setup Instructions

### Prerequisites

- .NET 8 SDK
- SQL Server
- Visual Studio 2022

### Configure Database

Update connection string in:

```json
appsettings.json
```

### Run Migrations

```bash
dotnet ef database update
```

### Run Application

```bash
dotnet run
```

### Swagger

Open:

```text
https://localhost:<port>/swagger
```

## Authentication

The application uses JWT Bearer Authentication.

### Roles

- Admin
- Employee

## Key Modules

### Employee Module

- Register Employee
- Activate Employee
- Employee Directory

### Leave Module

- View Leave Balance
- Apply Leave
- Approve Leave
- Reject Leave

### Holiday Module

- Add Holidays
- View Holidays

## Future Enhancements

- Email Notifications
- Manager Approval Workflow
- Audit Logging
- Azure Deployment
- Microsoft Entra ID Integration
