# Notification System API Documentation

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Getting JWT Token

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "role": "super-admin",
  "id": "user_id",
  "roleId": "role_id"
}
```

---

## REST API Endpoints

### Base URL
```
http://localhost:3000/api/v1/admin/notifications
```

### 1. Get Notifications

Fetch paginated notifications for the authenticated user.

**Endpoint:** `GET /api/v1/admin/notifications`

**Authentication:** Required (Super Admin only)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `is_read` (optional): Filter by read status (`true` or `false`)

**Example Request:**
```http
GET /api/v1/admin/notifications?page=1&limit=10&is_read=false
Authorization: Bearer <jwt_token>
```

**Example Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "6a93aa756d3c36325c895c68",
      "recipient_role": "super-admin",
      "title": "New Form Submitted",
      "message": "Student Abbie Fenton has submitted a question form.",
      "type": "FORM_SUBMISSION",
      "metadata": {
        "student_id": "6834d586e2b9a6c7594ddbb8",
        "student_name": "Abbie Fenton",
        "form_id": "68e683aee4195d788cd2b613",
        "submission_id": "6a93aa746d3c36325c895c63",
        "timestamp": "2026-08-30T03:58:44.945Z"
      },
      "is_read": false,
      "createdAt": "2026-08-30T03:58:45.686Z",
      "updatedAt": "2026-08-30T03:58:45.686Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### 2. Get Unread Count

Get the count of unread notifications for the authenticated user.

**Endpoint:** `GET /api/v1/admin/notifications/unread-count`

**Authentication:** Required (Super Admin only)

**Example Request:**
```http
GET /api/v1/admin/notifications/unread-count
Authorization: Bearer <jwt_token>
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

---

### 3. Mark Notification as Read

Mark a specific notification as read.

**Endpoint:** `PATCH /api/v1/admin/notifications/:id/read`

**Authentication:** Required (Super Admin only)

**Path Parameters:**
- `id`: Notification ID

**Example Request:**
```http
PATCH /api/v1/admin/notifications/6a93aa756d3c36325c895c68/read
Authorization: Bearer <jwt_token>
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "_id": "6a93aa756d3c36325c895c68",
    "recipient_role": "super-admin",
    "title": "New Form Submitted",
    "message": "Student Abbie Fenton has submitted a question form.",
    "type": "FORM_SUBMISSION",
    "is_read": true,
    "createdAt": "2026-08-30T03:58:45.686Z",
    "updatedAt": "2026-08-30T04:15:00.000Z"
  }
}
```

---

### 4. Mark All Notifications as Read

Mark all unread notifications as read for the authenticated user.

**Endpoint:** `PATCH /api/v1/admin/notifications/mark-all-read`

**Authentication:** Required (Super Admin only)

**Example Request:**
```http
PATCH /api/v1/admin/notifications/mark-all-read
Authorization: Bearer <jwt_token>
```

**Example Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "modifiedCount": 5
}
```

---

## Socket.io Real-Time Integration

### Connection Details

**Server URL:** `http://localhost:3000`
**Socket.io Path:** `/socket.io/`
**Protocol:** WebSocket (with HTTP polling fallback)

### Authentication

Socket.io connections require JWT authentication. The token must be provided in the handshake auth object:

**Auth Object Structure:**
```json
{
  "token": "<jwt_token>"
}
```

**Alternative:** Token can also be provided via Authorization header:
```
Authorization: Bearer <jwt_token>
```

**Authentication Flow:**
1. Client connects with JWT token in auth object
2. Server validates token using JWT_SECRET
3. On success: user data attached to socket, user joins appropriate room
4. On failure: connection rejected with error message

### Room Assignment

Users are automatically assigned to rooms based on their role:

| Role | Room Name |
|------|-----------|
| super-admin | `room:super-admin` |
| school | `room:school:<school_id>` |
| teacher | `room:teacher:<teacher_id>` |
| parent | `room:parent:<parent_id>` |
| student | `room:student:<student_id>` |

### Events

#### Server → Client Events

**Event Name:** `notification:new`

**Triggered When:** A new notification is created for the user's role

**Payload Structure:**
```json
{
  "id": "notification_id (string)",
  "recipient_role": "super-admin (string)",
  "title": "Notification title (string)",
  "message": "Notification message (string)",
  "type": "FORM_SUBMISSION | INCIDENT_REPORT | TICKET_CREATED | GENERAL (string)",
  "metadata": {
    "student_id": "student_id (string, optional)",
    "student_name": "Student Name (string, optional)",
    "form_id": "form_id (string, optional)",
    "submission_id": "submission_id (string, optional)",
    "timestamp": "ISO 8601 datetime string (optional)"
  },
  "is_read": false (boolean)",
  "createdAt": "ISO 8601 datetime string"
}
```





