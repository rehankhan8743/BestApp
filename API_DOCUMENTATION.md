# BestApp Forum API Documentation

Complete API documentation for BestApp Forum - a Mobilism-style discussion forum.

## Base URL

- **Development**: `http://localhost:5000/api`
- **Production**: `https://bestapp-nepr.onrender.com/api`

## Authentication

Most endpoints require authentication using JWT tokens.

### How to Authenticate

1. Login/Register to get a token
2. Include token in request headers:
```
Authorization: Bearer <your_token>
```

### Token Expiry
- Tokens expire after **30 days**

---

## Table of Contents

1. [Authentication](#authentication-endpoints)
2. [Users](#users-endpoints)
3. [Categories](#categories-endpoints)
4. [Threads](#threads-endpoints)
5. [Posts](#posts-endpoints)
6. [Messages](#messages-endpoints)
7. [Reports](#reports-endpoints)
8. [Search](#search-endpoints)
9. [Uploads](#uploads-endpoints)
10. [Notifications](#notifications-endpoints)
11. [Stats](#stats-endpoints)
12. [Admin](#admin-endpoints)

---

## Authentication Endpoints

### POST `/api/auth/register`
Register a new user account.

**Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "/uploads/avatars/default.png",
    "role": "user",
    "token": "jwt_token_here"
  }
}
```

---

### POST `/api/auth/login`
Login to existing account.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "/uploads/avatars/default.png",
    "role": "user",
    "token": "jwt_token_here"
  }
}
```

---

### GET `/api/auth/me`
Get current user profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "/uploads/avatars/default.png",
    "role": "user",
    "reputation": 150,
    "rank": "Member",
    "lastActive": "2024-01-15T10:30:00Z"
  }
}
```

---

## Users Endpoints

### GET `/api/users/:id`
Get user profile by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "johndoe",
    "avatar": "/uploads/avatars/default.png",
    "role": "user",
    "reputation": 150,
    "rank": "Member",
    "threadsCount": 5,
    "postsCount": 23
  }
}
```

---

### PUT `/api/users/profile`
Update own profile.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "username": "newusername",
  "bio": "My bio here"
}
```

---

### PUT `/api/users/avatar`
Upload new avatar.

**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `avatar`: Image file (max 5MB)

---

## Categories Endpoints

### GET `/api/categories`
Get all categories.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "category_id",
      "name": "Android Applications",
      "slug": "android-applications",
      "description": "Discuss Android apps",
      "icon": "📱",
      "color": "from-blue-500 to-blue-600",
      "threadCount": 150,
      "postCount": 1200
    }
  ]
}
```

---

### GET `/api/categories/:id`
Get single category with threads.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `sort`: Sort by (newest, oldest, most_replies, most_views)

---

## Threads Endpoints

### GET `/api/threads`
Get all threads (with filtering).

**Query Parameters:**
- `category`: Filter by category ID
- `page`: Page number
- `limit`: Items per page
- `sort`: Sort order

---

### GET `/api/threads/trending`
Get trending threads.

**Query Parameters:**
- `range`: Time range (day, week, month)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "thread_id",
      "title": "Thread Title",
      "slug": "thread-title",
      "author": { "username": "author" },
      "repliesCount": 45,
      "views": 1234,
      "createdAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

---

### GET `/api/threads/latest`
Get latest threads.

---

### GET `/api/threads/:id`
Get single thread with posts.

**Query Parameters:**
- `page`: Page number for posts

---

### POST `/api/threads`
Create new thread.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Thread Title",
  "content": "Thread content here...",
  "category": "category_id"
}
```

---

### PUT `/api/threads/:id`
Update thread (author only).

**Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content..."
}
```

---

### DELETE `/api/threads/:id`
Delete thread (author or admin).

---

### POST `/api/threads/:id/view`
Increment thread view count.

---

## Posts Endpoints

### GET `/api/posts/:threadId`
Get all posts in a thread.

**Query Parameters:**
- `page`: Page number
- `limit`: Posts per page (default: 10)

---

### POST `/api/posts`
Create new post.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "thread": "thread_id",
  "content": "Post content here..."
}
```

---

### PUT `/api/posts/:id`
Update post (author only).

**Body:**
```json
{
  "content": "Updated post content..."
}
```

---

### DELETE `/api/posts/:id`
Delete post (author or admin).

---

## Messages Endpoints

### GET `/api/messages`
Get user's conversations.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number
- `limit`: Conversations per page
- `unread`: Filter unread only (`true`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "conversation_id",
      "subject": "Hello",
      "otherParticipant": {
        "_id": "user_id",
        "username": "johndoe",
        "avatar": "/uploads/avatars/default.png"
      },
      "lastMessage": {
        "content": "Hi there!",
        "sender": "user_id",
        "createdAt": "2024-01-15T10:30:00Z",
        "isRead": false
      },
      "unreadCount": 2,
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### GET `/api/messages/:id`
Get single conversation.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "conversation_id",
    "subject": "Hello",
    "participants": [...],
    "messages": [
      {
        "_id": "message_id",
        "sender": {
          "_id": "user_id",
          "username": "johndoe"
        },
        "content": "Hi there!",
        "isRead": true,
        "readAt": "2024-01-15T10:35:00Z",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

---

### POST `/api/messages`
Start new conversation.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "recipientUsername": "johndoe",
  "subject": "Hello",
  "content": "Hi, how are you?"
}
```

---

### POST `/api/messages/:id/reply`
Reply to conversation.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "content": "Thanks for your message!"
}
```

---

### PUT `/api/messages/:id/read`
Mark conversation as read.

---

### DELETE `/api/messages/:id`
Delete conversation (soft delete).

---

## Reports Endpoints

### GET `/api/reports`
Get all reports (Moderator/Admin only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number
- `limit`: Reports per page
- `status`: Filter by status (pending, resolved, dismissed, all)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "report_id",
      "reporter": { "username": "reporter" },
      "type": "post",
      "target": { "post": {...} },
      "reason": "spam",
      "description": "This is spam content",
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET `/api/reports/:id`
Get single report (Moderator/Admin only).

---

### POST `/api/reports`
Create new report.

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "type": "post",
  "targetId": "post_id",
  "reason": "spam",
  "description": "This post contains spam content"
}
```

**Reason Options:**
- `spam`
- `abuse`
- `copyright`
- `wrong_section`
- `other`

---

### PUT `/api/reports/:id/resolve`
Resolve report (Moderator/Admin only).

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "actionTaken": "Deleted post and warned user"
}
```

---

### PUT `/api/reports/:id/dismiss`
Dismiss report (Moderator/Admin only).

---

## Search Endpoints

### GET `/api/search`
Search threads and posts.

**Query Parameters:**
- `q`: Search query
- `type`: Search type (all, threads, posts)
- `category`: Filter by category
- `page`: Page number
- `limit`: Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "threads": [...],
    "posts": [...]
  },
  "pagination": {...}
}
```

---

## Uploads Endpoints

### POST `/api/uploads/avatar`
Upload user avatar.

**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `avatar`: Image file (max 5MB, jpg/png/gif)

---

### POST `/api/uploads/file`
Upload general file.

**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `file`: File (max 100MB)

---

### POST `/api/uploads/screenshot`
Upload screenshot.

**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `screenshot`: Image file (max 10MB)

---

## Notifications Endpoints

### GET `/api/notifications`
Get user notifications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`: Page number
- `limit`: Notifications per page
- `unread`: Filter unread only

---

### PUT `/api/notifications/:id/read`
Mark notification as read.

---

### PUT `/api/notifications/read-all`
Mark all notifications as read.

---

## Stats Endpoints

### GET `/api/stats`
Get public statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalThreads": 450,
    "totalPosts": 3200,
    "onlineUsers": 25
  }
}
```

---

## Admin Endpoints

### GET `/api/admin/users`
Get all users (Admin only).

**Query Parameters:**
- `page`: Page number
- `limit`: Users per page
- `role`: Filter by role
- `search`: Search by username/email

---

### PUT `/api/admin/users/:id/role`
Update user role (Admin only).

**Body:**
```json
{
  "role": "moderator"
}
```

**Role Options:**
- `user`
- `moderator`
- `admin`

---

### PUT `/api/admin/users/:id/ban`
Ban user (Admin only).

**Body:**
```json
{
  "reason": "Violation of community guidelines",
  "duration": 7 // days, omit for permanent
}
```

---

### PUT `/api/admin/users/:id/unban`
Unban user (Admin only).

---

### GET `/api/admin/reports`
Get all reports (Admin only).

---

### GET `/api/admin/stats`
Get detailed admin statistics.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit)
- `500` - Server Error

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 10 requests per hour
- **Upload endpoints**: 20 requests per hour

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

---

## User Reputation System

Users earn reputation points for various activities:

| Activity | Points |
|----------|--------|
| Create thread | +5 |
| Create post | +2 |
| Thread gets reply | +1 |
| Post gets thanks | +3 |
| Best answer selected | +10 |

### Reputation Ranks

| Rank | Points Range |
|------|--------------|
| Newbie | 0-49 |
| Member | 50-199 |
| Senior | 200-499 |
| Expert | 500-999 |
| Legend | 1000+ |

---

## File Upload Limits

| Type | Max Size | Allowed Formats |
|------|----------|-----------------|
| Avatar | 5MB | JPG, PNG, GIF |
| Files | 100MB | Any |
| Screenshots | 10MB | JPG, PNG |

---

## GitHub Repository

https://github.com/rehankhan8743/BestApp

---

## Support

For issues or questions, please create an issue on GitHub or contact the admin.
