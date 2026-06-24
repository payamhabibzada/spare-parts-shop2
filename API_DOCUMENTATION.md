# API Documentation

Complete REST API documentation for the Shop Management System.

## Base URL

```
Development: http://localhost:4000/api
Production: https://api.yourdomain.com/api
```

## Authentication

All endpoints (except auth endpoints) require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token**: 15 minutes
- **Refresh Token**: 7 days
- Refresh tokens are stored in database and can be revoked

---

## Authentication Endpoints

### Shop Registration

Create a new shop account.

```http
POST /api/shop-auth/register
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+93 700 000 000",
  "shopName": "My Shop"
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "shopName": "My Shop"
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

**Errors:**
- `409 Conflict`: Email already exists
- `422 Unprocessable Entity`: Validation error

---

### Shop Login

Login as shop owner.

```http
POST /api/shop-auth/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "shopName": "My Shop"
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

---

### User Login

Login as shop employee.

```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin123!@#"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "username": "admin",
    "fullName": "Shop Administrator",
    "role": "ADMIN",
    "permissions": ["products:read", "products:write"]
  },
  "accessToken": "jwt...",
  "refreshToken": "jwt..."
}
```

---

### Refresh Token

Get new access token using refresh token.

```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "jwt..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "jwt...",
  "refreshToken": "jwt..." // New refresh token
}
```

---

### Logout

Invalidate refresh token.

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "refreshToken": "jwt..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

## Products

### List Products

Get paginated list of products.

```http
GET /api/products?page=1&limit=50&search=phone
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 50, max 100
- `search` (optional): Search by product name

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "iPhone 15",
      "categoryId": "uuid",
      "barcode": "123456789",
      "buyPriceAfn": "50000.00",
      "buyPriceUsd": "500.00",
      "sellPriceAfn": "60000.00",
      "sellPriceUsd": "600.00",
      "stock": 10,
      "minStock": 5,
      "description": "Latest iPhone model",
      "createdAt": "2026-06-06T12:00:00Z",
      "updatedAt": "2026-06-06T12:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

### Get Product

Get single product by ID.

```http
GET /api/products/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "iPhone 15",
  "categoryId": "uuid",
  "barcode": "123456789",
  "buyPriceAfn": "50000.00",
  "buyPriceUsd": "500.00",
  "sellPriceAfn": "60000.00",
  "sellPriceUsd": "600.00",
  "stock": 10,
  "minStock": 5,
  "description": "Latest iPhone model",
  "createdAt": "2026-06-06T12:00:00Z",
  "updatedAt": "2026-06-06T12:00:00Z"
}
```

---

### Create Product

Create a new product.

```http
POST /api/products
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
```

**Request Body:**
```json
{
  "name": "iPhone 15",
  "categoryId": "uuid",
  "barcode": "123456789",
  "buyPriceAfn": 50000,
  "buyPriceUsd": 500,
  "sellPriceAfn": 60000,
  "sellPriceUsd": 600,
  "stock": 10,
  "minStock": 5,
  "description": "Latest iPhone model"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "iPhone 15",
  ...
}
```

**Validation Rules:**
- `name`: Required, 1-200 characters
- `barcode`: Optional, max 100 characters
- `buyPriceAfn`, `buyPriceUsd`, `sellPriceAfn`, `sellPriceUsd`: Min 0
- `stock`, `minStock`: Non-negative integers

---

### Update Product

Update existing product.

```http
PUT /api/products/:id
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
```

**Request Body:** (same as create)

**Response:** `200 OK`
```json
{
  "ok": true
}
```

---

### Delete Product

Delete a product.

```http
DELETE /api/products/:id
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
```

**Response:** `200 OK`
```json
{
  "ok": true
}
```

---

## Customers

### List Customers

```http
GET /api/customers?page=1&limit=50&search=john
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "phone": "+93 700 000 000",
      "address": "Kabul, Afghanistan",
      "balanceAfn": "5000.00",
      "balanceUsd": "50.00",
      "createdAt": "2026-06-06T12:00:00Z",
      "updatedAt": "2026-06-06T12:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 50
}
```

---

### Create Customer

```http
POST /api/customers
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
```

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+93 700 000 000",
  "address": "Kabul, Afghanistan"
}
```

---

## Sales

### Create Sale

Create a new sale transaction.

```http
POST /api/sales
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
```

**Request Body:**
```json
{
  "customerId": "uuid",
  "invoiceNumber": "INV-001",
  "currency": "AFN",
  "items": [
    {
      "productId": "uuid",
      "quantity": 2,
      "price": 60000
    }
  ],
  "discount": 0,
  "paidAmount": 100000
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "invoiceNumber": "INV-001",
  "currency": "AFN",
  "totalAmount": "120000.00",
  "discount": "0.00",
  "paidAmount": "100000.00",
  "remainingAmount": "20000.00",
  "paymentStatus": "PARTIAL",
  "saleDate": "2026-06-06T12:00:00Z"
}
```

**Validation:**
- `items`: At least 1 item required
- `quantity`: Must be > 0 and <= product stock
- Sale automatically updates:
  - Product stock (decremented)
  - Customer balance (if credit)
  - Cash ledger (if paid)

---

## Payments

### Record Customer Payment

```http
POST /api/payments
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
```

**Request Body:**
```json
{
  "customerId": "uuid",
  "amount": 5000,
  "currency": "AFN",
  "note": "Payment for invoice INV-001"
}
```

**Response:** `201 Created`

---

## Suppliers

### List Suppliers

```http
GET /api/suppliers
Authorization: Bearer <token>
```

---

### Create Purchase

```http
POST /api/suppliers/purchases
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
```

**Request Body:**
```json
{
  "supplierId": "uuid",
  "totalAmountAfn": 100000,
  "totalAmountUsd": 0,
  "paidAmountAfn": 50000,
  "paidAmountUsd": 0,
  "items": [
    {
      "productName": "iPhone 15",
      "quantity": 10,
      "pricePerUnit": 50000
    }
  ],
  "description": "Monthly purchase"
}
```

---

## Shareholders

### List Shareholders

```http
GET /api/shareholders
Authorization: Bearer <token>
```

---

### Create Shareholder

```http
POST /api/shareholders
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
```

**Request Body:**
```json
{
  "name": "Ahmad Khan",
  "phone": "+93 700 000 000",
  "address": "Kabul",
  "investmentAmountAfn": 500000,
  "investmentAmountUsd": 0,
  "sharePercentage": 25.5
}
```

---

## Users Management

### List Users

```http
GET /api/users
Authorization: Bearer <token>
```

**Requires**: ADMIN or SUPER_ADMIN role

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "user1",
      "email": "user1@shop.com",
      "fullName": "User One",
      "role": "USER",
      "isActive": true,
      "permissions": ["products:read"],
      "createdAt": "2026-06-06T12:00:00Z"
    }
  ]
}
```

---

### Create User

```http
POST /api/users
Authorization: Bearer <token>
X-XSRF-TOKEN: <csrf_token>
```

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@shop.com",
  "password": "SecurePass123!",
  "fullName": "New User",
  "role": "USER",
  "permissions": ["products:read", "sales:read"]
}
```

**Validation:**
- Password must contain uppercase, lowercase, number, and special character
- Username must be unique per shop
- Email must be unique per shop

---

## Activity Logs

### List Activity Logs

```http
GET /api/logs?page=1&limit=50&action=ADD&entity=Product
Authorization: Bearer <token>
```

**Query Parameters:**
- `page`, `limit`: Pagination
- `action`: Filter by action (ADD, EDIT, DELETE)
- `entity`: Filter by entity type

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "username": "admin",
      "fullName": "Admin User",
      "action": "ADD",
      "entity": "Product",
      "entityName": "iPhone 15",
      "entityId": "uuid",
      "description": "Added new product",
      "beforeData": null,
      "afterData": { "name": "iPhone 15", ... },
      "createdAt": "2026-06-06T12:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 50
}
```

---

## Cash Ledger

### Get Cash Balance

```http
GET /api/cash
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "balanceAfn": "150000.00",
  "balanceUsd": "1500.00",
  "updatedAt": "2026-06-06T12:00:00Z"
}
```

**Cash ledger is automatically updated by:**
- Sales (increases cash)
- Purchases (decreases cash)
- Expenses (decreases cash)
- Withdrawals (decreases cash)
- Payments received (increases cash)
- Payments made (decreases cash)

---

## Error Responses

### Common Error Codes

**400 Bad Request**
```json
{
  "error": "Invalid request"
}
```

**401 Unauthorized**
```json
{
  "error": "Unauthorized - Invalid or expired token"
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden - Insufficient permissions"
}
```

**404 Not Found**
```json
{
  "error": "Resource not found"
}
```

**409 Conflict**
```json
{
  "error": "Duplicate entry - a record with this value already exists"
}
```

**422 Unprocessable Entity**
```json
{
  "error": "Validation error",
  "details": {
    "fieldErrors": {
      "name": ["String must contain at least 1 character(s)"],
      "price": ["Number must be greater than or equal to 0"]
    }
  }
}
```

**429 Too Many Requests**
```json
{
  "error": "Too many requests, please try again later"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- **Auth Endpoints** (`/api/auth`, `/api/shop-auth`): 20 requests per 15 minutes
- **All Other Endpoints**: 300 requests per minute

Exceeded limits return `429 Too Many Requests`.

---

## CSRF Protection

All state-changing requests (POST, PUT, PATCH, DELETE) require CSRF token:

1. Token is set in cookie: `XSRF-TOKEN`
2. Client must send same token in header: `X-XSRF-TOKEN`

Example:
```javascript
fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + accessToken,
    'X-XSRF-TOKEN': getCookie('XSRF-TOKEN'),
  },
  body: JSON.stringify(productData),
});
```

---

## Best Practices

### Authentication
- Store access token in memory (not localStorage)
- Store refresh token in httpOnly cookie
- Refresh access token proactively before expiration
- Handle 401 responses by refreshing token

### Error Handling
- Always check response status
- Display user-friendly error messages
- Log errors for debugging
- Handle network failures gracefully

### Performance
- Use pagination for large datasets
- Implement client-side caching
- Debounce search queries
- Use search parameter for filtering

### Security
- Never expose sensitive data in URLs
- Always validate input on client
- Handle CSRF tokens correctly
- Use HTTPS in production

---

## Postman Collection

Import this collection URL for easy testing:
```
<link-to-postman-collection>
```

---

For more information, see the main [README.md](./README.md) and [SECURITY.md](./SECURITY.md).
