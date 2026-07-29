# Forum API Documentation

## Base URL
```
http://localhost:3000/forum
```

## Authentication
All endpoints require:
- **Authentication**: Valid JWT token in Authorization header
- **Authorization**: User must have one of these roles: `super-admin`, `school`, `teacher`, `parent`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Endpoints

### 1. Create Post
**POST** `/forum/add-new`

Creates a new forum post.

**Authorization:** Only users with the following roles can create posts: `super-admin`, `school`, `teacher`, `parent`

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Note:** The `authorId` is automatically extracted from the authenticated user's JWT token.

**Response (201):**
```json
{
  "_id": "post_id",
  "authorId": "user_id",
  "content": "Post content",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Add Reply
**POST** `/forum/:postId/replies`

Adds a reply to a specific post.

**Authorization:** Only users with `super-admin` role can add replies.

**URL Parameters:**
- `postId` (string) - The ID of the post to reply to

**Request Body:**
```json
{
  "content": "string (required)"
}
```

**Note:** The `authorId` is automatically extracted from the authenticated user's JWT token.

**Response (201):**
```json
{
  "_id": "reply_id",
  "authorId": "user_id",
  "content": "Reply content",
  "createdAt": "2024-01-15T10:35:00.000Z"
}
```

---

### 3. Fetch Post with Replies
**GET** `/forum/:postId`

Retrieves a single post with all its replies.

**URL Parameters:**
- `postId` (string) - The ID of the post to fetch

**Response (200):**
```json
{
  "_id": "post_id",
  "authorId": "user_id",
  "author": {
    "firstName": "John",
    "lastName": "Doe",
    "photo": "https://example.com/photo.jpg"
  },
  "content": "Post content",
  "category": "general",
  "tags": [],
  "parentId": null,
  "upvotes": 0,
  "likes": ["user_id_1", "user_id_2"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "replies": [
    {
      "_id": "reply_id",
      "postId": "post_id",
      "authorId": "user_id_2",
      "author": {
        "firstName": "Jane",
        "lastName": "Smith",
        "photo": "https://example.com/photo.jpg"
      },
      "content": "Reply content",
      "upvotes": 0,
      "likes": [],
      "createdAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

**Note:** Both posts and replies include an `author` object with `firstName`, `lastName`, and `photo`. For school authors, `firstName` contains the school name and `lastName` is empty.
---

### 4. Fetch All Posts
**GET** `/forum/`

Retrieves all forum posts sorted by creation date (newest first).

**Response (200):**
```json
[
  {
    "_id": "post_id",
    "authorId": "user_id",
    "author": {
      "firstName": "John",
      "lastName": "Doe",
      "photo": "https://example.com/photo.jpg"
    },
    "content": "Post content",
    "category": "general",
    "tags": [],
    "parentId": null,
    "upvotes": 0,
    "likes": [],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "replies": [
      {
        "_id": "reply_id",
        "postId": "post_id",
        "authorId": "user_id_2",
        "author": {
          "firstName": "Jane",
          "lastName": "Smith",
          "photo": "https://example.com/photo.jpg"
        },
        "content": "Reply content",
        "upvotes": 0,
        "likes": [],
        "createdAt": "2024-01-15T10:35:00.000Z"
      }
    ]
  }
]
```

---

### 5. Toggle Like Post
**POST** `/forum/:postId/like`

Likes or unlikes a post. If the user has already liked the post, it removes the like. Otherwise, it adds the like.

**URL Parameters:**
- `postId` (string) - The ID of the post to like/unlike

**Request Body:**
```json
{
  "userId": "string (required)"
}
```

**Response (200):**
```json
{
  "_id": "post_id",
  "author": "John Doe",
  "content": "Post content",
  "category": "general",
  "tags": [],
  "parentId": null,
  "upvotes": 0,
  "likes": ["user_id"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "replies": []
}
```

---

### 6. Toggle Like Reply
**POST** `/forum/:postId/replies/:replyId/like`

Likes or unlikes a specific reply. If the user has already liked the reply, it removes the like. Otherwise, it adds the like.

**URL Parameters:**
- `postId` (string) - The ID of the parent post
- `replyId` (string) - The ID of the reply to like/unlike

**Request Body:**
```json
{
  "userId": "string (required)"
}
```

**Response (200):**
```json
{
  "_id": "reply_id",
  "postId": "post_id",
  "author": "Jane Doe",
  "content": "Reply content",
  "parentId": null,
  "upvotes": 0,
  "likes": ["user_id"],
  "createdAt": "2024-01-15T10:35:00.000Z"
}
```


## Data Models

### Post Model
```javascript
{
  _id: ObjectId,
  author: String (required),
  content: String (required),
  tags: [String],
  parentId: ObjectId (optional),
  upvotes: Number (default: 0),
  likes: [ObjectId], // Array of user IDs
  createdAt: Date,
  replies: [Reply] // Embedded array
}
```

### Reply Model
```javascript
{
  _id: ObjectId,
  postId: ObjectId,
  author: ObjectId (references Parent),
  content: String (required),
  upvotes: Number (default: 0),
  likes: [ObjectId], // Array of user IDs
  createdAt: Date
}
```

---

## Database Collection
All forum data is stored in the **`posts`** collection in MongoDB.


## Postman Collection Example

You can create a Postman collection with these requests:

1. **Create Post**
   - Method: POST
   - URL: `{{baseUrl}}/forum/add-new`
   - Auth: Bearer Token
   - Body: JSON with author, content, category

2. **Get All Posts**
   - Method: GET
   - URL: `{{baseUrl}}/forum/`
   - Auth: Bearer Token

3. **Get Single Post**
   - Method: GET
   - URL: `{{baseUrl}}/forum/{{postId}}`
   - Auth: Bearer Token

4. **Add Reply**
   - Method: POST
   - URL: `{{baseUrl}}/forum/{{postId}}/replies`
   - Auth: Bearer Token
   - Body: JSON with content

5. **Like Post**
   - Method: POST
   - URL: `{{baseUrl}}/forum/{{postId}}/like`
   - Auth: Bearer Token
   - Body: JSON with userId

6. **Like Reply**
   - Method: POST
   - URL: `{{baseUrl}}/forum/{{postId}}/replies/{{replyId}}/like`
   - Auth: Bearer Token
   - Body: JSON with userId
