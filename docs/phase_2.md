Phase 2: Authentication & Authorization (Production-Grade)

This phase is not just about login.

In HerbChain, every ownership transfer, certification, QR activation, blockchain event, and audit record depends on identity and permissions.

If Phase 1 (Database) is the heart, then Phase 2 is the security backbone.

Goal of Phase 2

Build a system where:

Every user is verified
Every request is authenticated
Every action is authorized
Every action is auditable


No user should be able to perform actions outside their role.

1. Authentication Architecture
Mobile App / Web App
          ↓
      Login API
          ↓
    JWT Issued
          ↓
   Protected APIs
          ↓
JWT Verification
          ↓
Role Verification
          ↓
Execute Request

2. User Lifecycle
Registration
User creates account
        ↓
Verify phone/email
        ↓
Admin approval (if needed)
        ↓
Account activated
        ↓
Can access platform


Not all users should become active immediately.

Example:

Farmer → Auto Approved
Transporter → Verification Needed
Lab → Verification Needed
Manufacturer → Verification Needed
AYUSH Admin → Created by system only

3. User States

Add user account states.

PENDING

ACTIVE

SUSPENDED

REJECTED

DEACTIVATED


Examples:

PENDING
Transporter registered
Awaiting approval

ACTIVE
Can use platform

SUSPENDED
Fraud detected
License expired

REJECTED
Verification failed

4. Registration Flow
Farmer Registration

Required:

Name

Phone

Email (optional)

Address

Farm Name

GPS Location

Government ID

Password

Transporter Registration

Required:

Name

Phone

Vehicle Number

Driving License

Government ID

Transport License

Lab Registration

Required:

Lab Name

Accreditation Number

Address

Responsible Person

License Documents

Manufacturer Registration

Required:

Company Name

GST Number

License Number

Address

Authorized Representative

AYUSH Admin

No registration.

Created directly by super admin.

5. Verification System

Create separate verification workflow.

verification_requests
id

user_id

document_type

document_url

status

verified_by

verified_at


Status:

PENDING

APPROVED

REJECTED

6. Authentication Methods
Primary
Phone + Password


Because rural users often don't use email.

Secondary
Email + Password

Future
OTP Login
Aadhaar Based Login
Government Integration

7. Password Security

Never store passwords.

Store:

password_hash


Use:

bcrypt


or

argon2


Never:

plain password

encrypted password


Only hashed passwords.

8. JWT Design

Upon login:

Backend generates:

Access Token
Refresh Token

Access Token

Short lifespan.

15 minutes


Contains:

{
  "userId":"uuid",
  "role":"FARMER",
  "status":"ACTIVE"
}

Refresh Token

Long lifespan.

30 Days


Used to generate new access token.

9. Session Management

Create:

user_sessions
id

user_id

device_id

refresh_token

ip_address

expires_at

last_active


Benefits:

Logout from all devices

Block stolen sessions

Track activity

10. Login Process
Phone
Password
    ↓
Validate User
    ↓
Check Status
    ↓
Generate Tokens
    ↓
Store Session
    ↓
Return Access Token

11. Logout Process
Receive token
      ↓
Delete session
      ↓
Invalidate refresh token
      ↓
Logout successful

12. Role Based Access Control (RBAC)

This is critical.

Never trust frontend.

Backend decides permissions.

Core Roles
FARMER

TRANSPORTER

LAB

MANUFACTURER

AYUSH_ADMIN

13. Permission Matrix
Farmer

Can:

Register Batch

View Own Batches

Transfer Batch

View Payments

View History


Cannot:

Create Lab Certificate

Create Product

Access AYUSH Dashboard

Transporter

Can:

View Assigned Shipments

Scan QR

Accept Ownership

Transfer Ownership

Update Delivery Status


Cannot:

Edit Batch Details

Edit Certificates

Create Products

Lab

Can:

Request Batch

Receive Batch

Conduct Testing

Issue Certificates

Reject Batches


Cannot:

Modify Farmer Data

Modify Transfers

Manufacturer

Can:

View Certified Batches

Request Materials

Create Product

Link Batches

Generate Product QR


Cannot:

Edit Lab Results

AYUSH Admin

Can:

View Everything

Verify Users

Suspend Users

Run Audits

Trace Products

View Analytics


Cannot:

Become Owner Of Batch


Important distinction:

Admin monitors

Admin never owns

14. Fine-Grained Permissions

Don't hardcode permissions.

Create tables.

permissions
id

permission_key

description


Example:

batch.create

batch.transfer

batch.view

lab.certify

product.create

shipment.manage

role_permissions
id

role

permission_id


This allows future expansion.

Example:

State Inspector

Regional Officer

Consumer Auditor


Without changing code.

15. API Protection Layers

Every API request passes through:

JWT Validation
      ↓
Account Status Check
      ↓
Role Check
      ↓
Permission Check
      ↓
Execution


Example:

POST /lab/certify


Checks:

Valid token ?

User active ?

Role = LAB ?

Permission = lab.certify ?


Then execute.

16. Ownership Authorization Layer

This is unique to HerbChain.

Even if user is authenticated.

The system verifies ownership.

Example:

Transporter scans batch


Checks:

Current Owner = Farmer?

Transporter assigned?

QR active?

Shipment exists?


Only then transfer ownership.

So we have:

Authentication
     +
Authorization
     +
Ownership Validation

17. Admin Controls

AYUSH Admin can:

Suspend User

Reactivate User

Approve Labs

Approve Manufacturers

Blacklist Accounts

View Audit Logs


Create:

user_status_logs
id

user_id

old_status

new_status

changed_by

reason

created_at

18. Audit Every Security Action

Create security audit logs.

auth_logs
id

user_id

event_type

ip_address

device_id

success

timestamp


Event types:

LOGIN

LOGOUT

PASSWORD_CHANGE

TOKEN_REFRESH

ACCOUNT_LOCKED

LOGIN_FAILED

19. Fraud Protection

Production-level safeguards.

Failed Login Tracking

After:

5 failed attempts


Lock account temporarily.

Device Tracking

Track:

Device ID

IP Address

OS

Browser

Suspicious Activity

Examples:

Same account

Logging from Chennai

Then Delhi after 2 minutes


Flag account.

20. Password Recovery

Flow:

Forgot Password
       ↓
OTP to Phone
       ↓
Verify OTP
       ↓
Reset Password
       ↓
Invalidate All Sessions

21. Future Enterprise Features

Keep schema ready for:

Multi-Factor Authentication

Aadhaar Verification

Government SSO

Biometric Login

Passkeys


Not needed now, but don't block future integration.

22. APIs Expected From Phase 2
Public APIs
POST /auth/register

POST /auth/login

POST /auth/refresh

POST /auth/forgot-password

POST /auth/reset-password

Protected APIs
GET /me

POST /logout

GET /my-sessions

DELETE /session/:id

Admin APIs
GET /users

GET /users/:id

PUT /users/approve

PUT /users/suspend

PUT /users/reject

23. Database Additions Needed in Phase 2

New tables beyond Phase 1:

verification_requests

permissions

role_permissions

user_sessions

user_status_logs

auth_logs

Final Output of Phase 2

After Phase 2 is complete, HerbChain should support:

✅ Secure Registration

✅ User Verification

✅ Login/Logout

✅ JWT Authentication

✅ Refresh Tokens

✅ Session Management

✅ Role-Based Access Control

✅ Permission-Based Authorization

✅ Ownership-Aware Security

✅ Audit Logging

✅ Fraud Prevention

✅ Password Recovery

✅ Admin User Governance


At the end of Phase 2, you'll have a production-grade identity and security layer that every future phase (Batch Creation, QR Engine, Ownership Transfer, Lab Certification, Manufacturing, Blockchain) can safely build upon.