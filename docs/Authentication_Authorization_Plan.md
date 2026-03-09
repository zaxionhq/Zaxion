# Authentication & Authorization Plan for Zaxion Governance

## Executive Summary
This document outlines the comprehensive authentication and authorization architecture for Zaxion, addressing the current limitation where repository maintainers cannot access governance tools they need without being granted full system administrator privileges. The solution introduces a three-tier role-based access control (RBAC) model with repository-scoped permissions, secure token management, and robust audit logging.

## 1. Analysis of Current Mechanism
The current Zaxion authentication system relies on a Role-Based Access Control (RBAC) model with two primary roles: `user` and `admin`.
- **Authentication**: JWT-based stateless authentication (`authenticateJWT` middleware).
- **Authorization**: Role checks via `authorize` middleware.
- **Disparity**: Critical governance features (Policy Approval, Simulation, Code Analysis) are restricted to the `admin` role in production environments via the `adminOnlyRoles` configuration in `policy.routes.js`.
- **Limitation**: Repository maintainers (who are responsible for code quality but not system administration) are treated as standard `users` and cannot access governance tools they need, such as running policy simulations or analyzing code against policies.

## 2. Secure Authentication Flow Design

### 2.1 Identity Provider Integration
**Primary Authentication Method**: GitHub OAuth 2.0

**Authentication Protocol Flow**:
1.  User initiates login request through Zaxion interface.
2.  Application redirects user to GitHub OAuth authorization endpoint.
3.  User grants Zaxion requested OAuth scopes (`read:user`, `read:org`, `repo`).
4.  GitHub redirects user back to Zaxion callback endpoint with authorization code.
5.  Zaxion backend exchanges authorization code for GitHub access token.
6.  Zaxion retrieves user profile and permission data from GitHub API.
7.  System determines appropriate Zaxion role based on GitHub permissions (see Section 3.2).
8.  Zaxion generates internal JWT with role claims.
9.  Session established with both GitHub access token (encrypted storage) and Zaxion JWT.

### 2.2 Permission Synchronization System
-   **Initial Sync**: Upon login, query GitHub API for all repositories where Zaxion is installed and check user permissions (`admin`, `write`, `read`).
-   **Continuous Sync**: Subscribe to GitHub webhooks (`member`, `repository`, `organization`, `installation`) to trigger immediate permission re-evaluation.
-   **Scheduled Sync**: Daily job to verify permission accuracy and handle edge cases.

## 3. Authorization Model Design (RBAC)

### 3.1 Three-Tier Role Definitions

| Role | Scope | Capabilities | Restrictions |
| :--- | :--- | :--- | :--- |
| **User** | Read-only | View public policies, decisions, and personal settings. | Cannot execute governance actions or simulations. |
| **Maintainer** | Repository-Level | **Scoped to owned repos**: Run simulations, analyze code, approve/reject policies, view detailed analytics. | Cannot access system admin, user management, or global configs. |
| **Admin** | System-Wide | All maintainer capabilities + User management, global policy config, billing, system settings. | None. |

### 3.2 Role Assignment Logic
-   **Automatic**:
    -   User has `admin` or `write` permission on any installed repo -> **Maintainer**.
    -   User has only `read` or `none` -> **User**.
-   **Manual**: System admins can explicitly promote users to **Admin**.

### 3.3 Authorization Middleware Chain
1.  **Authentication Validation**: Verify JWT signature and expiration.
2.  **Role-Based Authorization**: Check if user role meets minimum requirement (e.g., `maintainer`).
3.  **Repository Scope Validation** (for Maintainer actions):
    -   Extract repo ID from request.
    -   Verify user has `admin`/`write` permission for that specific repo in the database mapping.
    -   Admins bypass this check.

## 4. Security Countermeasures

### 4.1 Multi-Factor Authentication (MFA)
-   **Requirement**: Mandatory TOTP MFA for `admin` and `maintainer` roles for sensitive actions (Policy Approval, Config Changes).
-   **Enforcement**: 7-day grace period after role assignment, then restricted to read-only.

### 4.2 Token Management
-   **Access Token**: JWT (RS256), 15-min lifetime, stored in memory. Claims: `sub`, `role`, `perms_hash`.
-   **Refresh Token**: Cryptographically random string, 30-day sliding window, stored in `HttpOnly` `Secure` `SameSite=Strict` cookie. Rotated on use.
-   **GitHub Token**: Encrypted at rest (AES-256-GCM), server-side only.

### 4.3 Session Management
-   **Controls**: Concurrent session limits, idle timeout (24h), forced re-auth on role changes.

### 4.4 Comprehensive Audit Logging
-   **Events**: Login/Logout, Role Changes, Permission Grants, Policy Simulations, Approvals, Admin Actions.
-   **Storage**: Immutable, tamper-evident log table.

## 5. Data Architecture & Schema Modifications

### 5.1 Database Updates
-   **Users Table**:
    -   Update `role` ENUM: `['user', 'maintainer', 'admin']`.
    -   Add `mfa_enabled` (boolean), `mfa_secret` (encrypted).
-   **New Table: Repositories**:
    -   `id`, `github_repo_id`, `name`, `owner`, `installation_id`.
-   **New Table: RepositoryMaintainerMappings**:
    -   `user_id`, `repository_id`, `github_permission_level` (`admin`, `write`).
-   **New Table: RefreshTokens**:
    -   `token_hash`, `user_id`, `expires_at`, `revoked`.
-   **New Table: AuditEvents**:
    -   `event_type`, `actor_id`, `target_id`, `action`, `metadata`, `timestamp`.

## 6. Migration Strategy

### 6.1 Phased Rollout
1.  **Phase 1: Schema Extension (Zero Downtime)**
    -   Create new tables and columns.
    -   Update `role` ENUM.
2.  **Phase 2: Data Backfill**
    -   Script to scan existing users and GitHub permissions.
    -   Populate `Repositories` and `RepositoryMaintainerMappings`.
    -   Update user roles based on discovered permissions.
3.  **Phase 3: Code Deployment**
    -   Deploy backend with new middleware and route logic.
    -   Enable new auth flow.

## 7. Testing Protocols
-   **Unit Tests**: Verify `authorize` middleware logic, JWT generation, and scope validation.
-   **Integration Tests**:
    -   **Scenario 1**: Maintainer accesses own repo simulation -> **Success**.
    -   **Scenario 2**: Maintainer accesses *other* repo simulation -> **Forbidden**.
    -   **Scenario 3**: User attempts admin route -> **Forbidden**.
    -   **Scenario 4**: Admin accesses any repo -> **Success**.
-   **UAT**: Verify dashboard access for different personas.

## 8. Incident Response
-   **Unauthorized Access**: Alert on >3 failed attempts/min. Auto-lock for 15m.
-   **Compromised Maintainer**: Immediate session revocation, refresh token invalidation, force MFA re-enrollment.
-   **Privilege Escalation**: Alert on `user` accessing `admin` endpoint.

---
**Reference**: This plan incorporates the architectural standards defined in `docs/Reference.md`.
