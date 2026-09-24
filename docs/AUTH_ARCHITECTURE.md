# Authentication Architecture

## 1. Overview
- Passwordless email-based OTP authentication system.
- No passwords stored anywhere in the database.
- Session-based authentication using HTTP-only secure cookies.

## 2. OTP Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Server
    participant DB
    participant Email

    User->>Frontend: Enter email at checkout
    Frontend->>Server: POST /api/auth/send-otp { email }
    Server->>Server: Generate 6-digit OTP & Hash
    Server->>DB: Store { email, hashedOtp, expiresAt, attempts: 0 }
    Server->>Email: Send OTP email
    Email-->>User: Delivery
    User->>Frontend: Enter OTP
    Frontend->>Server: POST /api/auth/verify-otp { email, otp }
    
    Server->>DB: Fetch stored OTP details
    Server->>Server: Validate (not expired, attempts < 3)
    Server->>Server: Compare hash
    
    alt is valid
        Server->>DB: Check if user exists
        alt User exists
            Server->>Server: Authenticate user
        else User doesn't exist
            Server->>DB: Create user (name, phone, email)
        end
        Server->>DB: Create Session
        Server-->>Frontend: Set HTTP-only Cookie
    else is invalid
        Server->>DB: Increment attempts
        Server-->>Frontend: Return Error
    end
```

## 3. OTP Security Rules
- **OTP length:** 6 digits
- **OTP expiry:** 5 minutes
- **Max attempts per OTP:** 3
- **Resend cooldown:** 60 seconds
- **Rate limit:** 5 OTP requests per email per hour
- **IP-based rate limit:** 10 OTP requests per IP per hour
- **Storage:** OTP stored as bcrypt hash (never plaintext)
- **Cleanup:** OTP deleted after successful verification
- **Invalidation:** Previous OTPs invalidated on new request

## 4. Session Management
- **Session ID:** Cryptographically random identifier (e.g., nanoid or crypto.randomUUID).
- **Storage:** Stored in PostgreSQL `Session` table.
- **Session fields:** id, userId, role, expiresAt, createdAt, userAgent, ipAddress.
- **Cookie details:** `ghero_session` (HTTP-only, Secure, SameSite=Lax, Path=/, MaxAge=30 days).
- **Validation:** Conducted on every protected request via middleware.
- **Cleanup:** Expired sessions are periodically purged.

## 5. Role-Based Access Control
- **Roles:** `CUSTOMER`, `ADMIN`
- Role is stored on the `User` model.
- **Middleware checks:**
  - `/account/*` → requires authenticated user (any role)
  - `/admin/*` → requires authenticated user with `ADMIN` role
  - `/api/admin/*` → requires `ADMIN` role (checked server-side in route handler)
  - Public routes → no authentication required

## 6. Checkout Authentication Gate

```mermaid
flowchart TD
    Checkout[User fills checkout form\nname, email, phone, address] --> Click[Click 'Place Order']
    Click --> CheckAuth{Is Authenticated?}
    
    CheckAuth -- Yes --> Proceed[Proceed to Payment]
    CheckAuth -- No --> OTPModal[Show OTP Modal]
    
    OTPModal --> EnterOTP[User enters OTP]
    EnterOTP --> VerifyOTP{OTP Verified?}
    
    VerifyOTP -- No --> OTPModal
    VerifyOTP -- Yes --> CheckEmail{Email exists?}
    
    CheckEmail -- New Email --> CreateUser[Create user with checkout data]
    CheckEmail -- Existing Email --> AuthUser[Authenticate User]
    
    CreateUser --> SetSession[Set Session Cookie]
    AuthUser --> SetSession
    SetSession --> Proceed
```

## 7. Admin Authentication
- Admin login accessible at `/admin/login`.
- Utilizes the same OTP flow with additional checks:
  - Only emails corresponding to an `ADMIN` role can access the admin panel.
  - If a non-admin email attempts admin login, the request is rejected.
  - Admin session inherently has `role=ADMIN`.

## 8. Logout
- **Endpoint:** `POST /api/auth/logout`
- **Actions:**
  - Delete the session record from the database.
  - Clear the `ghero_session` cookie.
  - Redirect the user to the homepage.
