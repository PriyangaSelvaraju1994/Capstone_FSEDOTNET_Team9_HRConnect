# HRConnect Database Design

## Overview

The HRConnect database stores employee information, leave balances, leave requests, holidays, and authentication details.

Database Engine:
- SQL Server

## Entity Relationship Overview

```text
Employee
   |
   | 1
   |
   | *
LeaveBalance

Employee
   |
   | 1
   |
   | *
LeaveRequest

LeaveType
   |
   | 1
   |
   | *
LeaveBalance

LeaveType
   |
   | 1
   |
   | *
LeaveRequest

Holiday
```

---

## Employee Table

| Column | Type |
|----------|----------|
| Id | int |
| FirstName | varchar |
| LastName | varchar |
| Email | varchar |
| PasswordHash | varchar |
| Role | varchar |
| IsActive | bit |
| CreatedDate | datetime |

Purpose:
- Stores employee information.

---

## LeaveType Table

| Column | Type |
|----------|----------|
| Id | int |
| Name | varchar |
| DefaultDays | int |

Examples:

- Casual Leave
- Sick Leave
- Earned Leave

---

## LeaveBalance Table

| Column | Type |
|----------|----------|
| Id | int |
| EmployeeId | int |
| LeaveTypeId | int |
| TotalLeaves | int |
| UsedLeaves | int |
| RemainingLeaves | int |

Purpose:
- Tracks leave allocation and consumption.

---

## LeaveRequest Table

| Column | Type |
|----------|----------|
| Id | int |
| EmployeeId | int |
| LeaveTypeId | int |
| StartDate | date |
| EndDate | date |
| NumberOfDays | int |
| Reason | varchar |
| Status | varchar |
| AppliedDate | datetime |

Status Values:

- Pending
- Approved
- Rejected

---

## Holiday Table

| Column | Type |
|----------|----------|
| Id | int |
| Name | varchar |
| Date | date |
| Description | varchar |

Purpose:
- Stores company holidays.

---

## Relationships

### Employee → LeaveBalance

```text
One Employee
      |
      |
      v
Many Leave Balances
```

### Employee → LeaveRequest

```text
One Employee
      |
      |
      v
Many Leave Requests
```

### LeaveType → LeaveBalance

```text
One Leave Type
      |
      |
      v
Many Leave Balances
```

### LeaveType → LeaveRequest

```text
One Leave Type
      |
      |
      v
Many Leave Requests
```

## Constraints

### Employee

- Email must be unique.

### LeaveBalance

- EmployeeId must exist in Employee table.
- Employee must be active

### LeaveRequest

- EmployeeId must exist in Employee table.

### Holiday

- Holiday date should be unique.
