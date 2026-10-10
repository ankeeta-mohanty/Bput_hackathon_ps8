# Corporate ESG Reporting Portal
> **Centralized BRSR & Sustainability Data Management**  
> *A modular, multi-tier enterprise hackathon prototype aligned with SEBI BRSR guidelines.*

---

## 📌 Phase 2 Completed: Authentication, Authorization & RBAC

This repository contains the complete implementation of **Phase 2: Authentication, Authorization & RBAC** for the **Corporate ESG Reporting Portal**, building upon the foundational architecture of Phase 1.

The portal provides an end-to-end, cryptographically secured identity layer backed by MongoDB, role-scoped organizational isolation, automated demo account seeding, foundational ESG submission schemas, and a role-aware React client.

---

## 🏛️ System & Authentication Architecture

```text
React 19 Client (Vite + Tailwind CSS + AuthContext) [Port 5173]
                       ↓ Authorization: Bearer <JWT>
Node.js + Express.js API Gateway [Port 5000]
                       ↓ requireAuth / requireRole
Mongoose ODM (Live MongoDB User Query & Scoping)
                       ↓
         MongoDB Database (Local / Atlas Cloud)
```

### 1. Token Strategy & Session Handling
- **Bearer Tokens:** Client receives a signed JWT upon successful login and attaches it in the HTTP `Authorization: Bearer <token>` header.
- **Stateless Validation with Live Database Authority:** The `requireAuth` middleware verifies token signature and expiration, then loads the **live User record from MongoDB**. This ensures account deactivations and role alterations take effect immediately without waiting for token expiry.
- **Client Session Interceptor:** `AuthContext.jsx` restores sessions on page reload via `GET /api/auth/me` and automatically purges expired tokens from client storage.

### 2. Password Security
- **Bcrypt Hashing:** Passwords hashed using `bcryptjs` with 10 salt rounds.
- **Zero Plaintext Storage:** Plaintext passwords are never stored or logged.
- **Zero Exposure:** `passwordHash` is excluded from JSON serialization and query projections.
- **Generic Auth Errors:** Login failures return generic `401 Unauthorized` messages to prevent email enumeration attacks.

---

## 👥 3-Tier Enterprise Role Hierarchy & Permissions

| Role | Permitted Scope | Permissions & Target Interface |
| :--- | :--- | :--- |
| **`SITE_MANAGER`** | Assigned Project Sites (`siteIds`) | Access assigned site records only (`GET /api/sites`). Create & edit drafts, input monthly utility bills, and submit for subsidiary review. Cannot approve own submissions. |
| **`SUBSIDIARY_ESG_MANAGER`** | Assigned Subsidiary (`subsidiaryId`) | Access all sites belonging to their subsidiary (`GET /api/sites`). Review site submissions, inspect anomaly detection alerts, approve or request revisions. |
| **`GROUP_ESG_EXECUTIVE`** | Corporate Group (`groupId`) | Access all subsidiaries and project sites across the conglomerate group (`GET /api/sites`). Conglomerate rollup analytics, BRSR compliance audits, official PDF filing. |

---

## 🗄️ Database Schemas & Data Hierarchy

The organizational hierarchy is enforced across four core Mongoose models:

```text
Group (MEIL Group)
  └── Subsidiary (MEIL-INFRA, MEIL-ENERGY, MEIL-WATER)
        └── ProjectSite (HYD-METRO, ZOJILA-TUNNEL, BHADLA-SOLAR, ...)
              └── ESGSubmission (Versioned Period Submissions)
```

### User Model (`backend/src/models/User.js`)
- `name`: String, required, trimmed
- `email`: String, required, unique index, lowercase
- `passwordHash`: String, hidden in JSON conversion
- `role`: Enum `['SITE_MANAGER', 'SUBSIDIARY_ESG_MANAGER', 'GROUP_ESG_EXECUTIVE']`
- `isActive`: Boolean, default: `true`
- `groupId`: ObjectId reference to `Group`
- `subsidiaryId`: ObjectId reference to `Subsidiary` (required for Site and Subsidiary managers)
- `siteIds`: Array of ObjectId references to `ProjectSite` (required for Site managers)

### Foundational ESG Submission Model (`backend/src/models/ESGSubmission.js`)
- `siteId`, `subsidiaryId`, `groupId`: ObjectIds referencing the organizational hierarchy
- `reportingPeriod`: String (e.g. `FY2025-Q1`, `M04`)
- `reportingYear`: Number (e.g. `2025`)
- `status`: Enum `['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED']`
- `rawMetrics`: Mixed object for input data
- `calculatedMetrics`: Mixed object for Scope 1 tCO2e and intensities
- `validationResults`: Schema validation errors and warning flags
- `createdBy`, `submittedBy`, `reviewedBy`: User references
- `version`: Number, default: 1
- **Uniqueness Policy:** Compound unique index on `{ siteId: 1, reportingYear: 1, reportingPeriod: 1, version: 1 }`. This prevents accidental duplicate records for the same period while allowing deliberate version revisions.
- **Hierarchy Integrity Pre-Hook:** Automatically validates before saving that the ProjectSite belongs to the designated Subsidiary and the Subsidiary belongs to the designated Group.

---

## 🔑 Demo Role Accounts & Credentials

The seed pipeline creates 3 pre-configured demo users in MongoDB:

| Role | Demo Email | Default Password | Initial Scoped Assignment |
| :--- | :--- | :--- | :--- |
| **Site Manager** | `site.manager@meil.demo` | `Demo@2026!` | `HYD-METRO` & `ZOJILA-TUNNEL` sites under `MEIL-INFRA` |
| **Subsidiary ESG Manager** | `subsidiary.manager@meil.demo` | `Demo@2026!` | All sites under `MEIL Infrastructure Ltd` |
| **Group ESG Executive** | `group.executive@meil.demo` | `Demo@2026!` | All subsidiaries and sites in `MEIL Group` |

*Note: Demo password is configurable via `DEMO_USER_PASSWORD` in `backend/.env`.*

---

## 🔌 Available API Endpoints

### Authentication & Identity
- `POST /api/auth/login` — Authenticate credentials, return JWT & safe user representation.
- `GET /api/auth/me` — Retrieve current authenticated profile and organizational scopes (Bearer Token required).
- `POST /api/auth/logout` — Acknowledge session termination and guide client token clearance.

### Scoped Data & Diagnostics
- `GET /api/sites` — Scoped project sites query strictly filtered to user's role hierarchy (Bearer Token required). Returns HTTP 401 if unauthenticated, HTTP 403 if unauthorized site requested.
- `GET /api/health` — Full-stack system and database health check (Public).
- `GET /` — API portal description (Public).

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies
```bash
# Backend dependencies (express, mongoose, bcryptjs, jsonwebtoken, etc.)
cd backend && npm install

# Frontend dependencies (react 19, vite, tailwindcss, lucide-react, etc.)
cd ../frontend && npm install
```

### Step 2: Configure Environment Variables

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/esg_portal
CLIENT_URL=http://localhost:5173
JWT_SECRET=esg_reporting_portal_super_secret_hackathon_key_2026
JWT_EXPIRES_IN=24h
DEMO_USER_PASSWORD=Demo@2026!
```

#### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Seed the Database
```bash
npm run seed
# Or from backend directory:
# cd backend && npm run seed
```
*Seeds 1 Group, 3 Subsidiaries, 6 Project Sites, and 3 Demo Role Accounts idempotently.*

### Step 4: Run the Application
From the root directory:
```bash
npm run dev
```
Or in separate terminals:
```bash
npm run dev:backend   # Express REST API on http://localhost:5000
npm run dev:frontend  # React Vite Client on http://localhost:5173
```

---

## 🧪 Automated Testing & Verification

The project includes a comprehensive Node.js native test suite (`node:test`) covering **32 isolated test cases**:

```bash
npm test
# Or from backend:
# cd backend && npm test
```

### Test Coverage Breakdown (32/32 Passed - 100%):
- **Authentication (1–14):** Successful login, incorrect password, unknown email, missing payload fields, deactivated user rejection, bcrypt verification, password hash exclusion, current-user retrieval, missing/invalid/expired token rejections, logout endpoint.
- **Role-Based Authorization & Scoping (15–21):** Site Manager scoped access, Site Manager unauthorized site rejection (403), Subsidiary Manager subsidiary scoping, Subsidiary Manager external site rejection (403), Group Executive external group rejection (403), client token claim tampering resistance, deactivated user middleware rejection.
- **Data Models (22–28):** User role enum validation, email uniqueness enforcement, User organizational scope validation, ESGSubmission required-field validation, invalid status rejection, hierarchy mismatch rejection, duplicate version prevention with revision support.
- **Regression (29–32):** GET `/api/health`, GET `/api/sites` (protected), GET `/` root info, 404 handler.

### Frontend Quality Verification:
```bash
# Production bundle verification
npm run build:frontend

# Linting verification
npm --prefix frontend run lint
```

---

## ⏩ Roadmap & Future Phases

| Phase | Milestone | Scope |
| :---: | :--- | :--- |
| **Phase 1** | Foundation & Architecture | ✅ Completed: Vite, Express, Mongo connection, Site schemas, Diagnostics UI |
| **Phase 2** | Authentication & RBAC | ✅ Completed: JWT, Bcrypt, 3 Roles, Scoped APIs, Protected Routes, ESGSubmission model |
| **Phase 3** | Site Data Entry | ⏳ Next: Energy, Water, Waste, Social forms, Draft save/resume, Site Submissions |
| **Phase 4** | SEBI BRSR Disclosures | ⏳ Sections A, B, and C disclosure inputs |
| **Phase 5** | Calculation Engine | ⏳ Scope 1 tCO2e, emission intensities, recycling %, anomaly detection |
| **Phase 6** | Subsidiary Review | ⏳ Audit queue, approval lifecycle, revision comments |
| **Phase 7** | Data Roll-Up Aggregation | ⏳ Site → Subsidiary → Group consolidation engine |
| **Phase 8** | Executive Analytics | ⏳ Conglomerate Recharts analytics dashboard |
| **Phase 9** | Compliance Checker | ⏳ Automated missing field and SEBI compliance audit |
| **Phase 10** | PDF Report Generation | ⏳ Official BRSR filing export with SDG tags |
| **Phase 11–14** | Advanced Capabilities | ⏳ Maturity assessment, AI Bill OCR, AI Assistant |
