# HRConnect API Reference

## Base URL

```text
https://localhost:5153/api
```

---

# Authentication

## Register Employee

### Endpoint

```http
POST /api/auth/register
```

### Request

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password@123"
}
```

### Response

```json
{
  "message": "Registration successful. Awaiting admin approval."
}
```

---

## Login

### Endpoint

```http
POST /api/auth/login
```

### Request

```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

### Response

```json
{
  "token": "jwt-token"
}
```

---

# Employee APIs

## Get Employees

### Endpoint

```http
GET /api/employees
```

### Authorization

Admin

### Response

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
]
```

---

## Approve Employee

### Endpoint

```http
PUT /api/employees/{employeeId}/approve
```

### Authorization

Admin

### Response

```json
{
  "message": "Employee approved successfully."
}
```

---

# Leave APIs

## Get Leave Balances

### Endpoint

```http
GET /api/leaves/balances/{employeeId}
```

### Response

```json
[
  {
    "leaveType": "Casual Leave",
    "remainingLeaves": 10
  }
]
```

---

## Apply Leave

### Endpoint

```http
POST /api/leaves/apply
```

### Request

```json
{
  "employeeId": 1,
  "leaveTypeId": 1,
  "startDate": "2026-06-20",
  "endDate": "2026-06-22",
  "reason": "Vacation"
}
```

### Response

```json
{
  "message": "Leave request submitted successfully."
}
```

---

## Approve Leave

### Endpoint

```http
PUT /api/leaves/{leaveId}/approve
```

### Authorization

Admin

### Response

```json
{
  "message": "Leave approved successfully."
}
```

---

# Holiday APIs

## Get Holidays

### Endpoint

```http
GET /api/holidays
```

### Response

```json
[
  {
    "id": 1,
    "name": "Independence Day",
    "date": "2026-08-15"
  }
]
```

---

## Add Holiday

### Endpoint

```http
POST /api/holidays
```

### Authorization

Admin

### Request

```json
{
  "name": "Christmas",
  "date": "2026-12-25"
}
```

### Response

```json
{
  "message": "Holiday created successfully."
}
```

---

# Response Codes

| Code | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Validation Error |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

# Swagger

Swagger UI is available at:

```text
https://localhost:5153/swagger
```