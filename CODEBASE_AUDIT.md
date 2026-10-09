# Comprehensive Codebase & Architecture Audit
**Project:** Corporate ESG Reporting Portal  
**Scope:** Phase 1 Foundation & Readiness Audit  
**Date:** September 2026  

---

## 1. Feature Status Matrix

| Feature | Current Status | Real/Mock | Database Connected? | Hardcoded? | Action Required | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vite + React Setup** | REAL IMPLEMENTATION | Real | N/A | No | Complete and operational | Low |
| **Tailwind Design System** | REAL IMPLEMENTATION | Real | N/A | No | Complete and operational | Low |
| **React Router Shell** | PARTIALLY IMPLEMENTED | Real | N/A | No | Placeholders present for future routes | Medium |
| **API Health Check (`/api/health`)** | PARTIALLY IMPLEMENTED | Real | Connected Check | Partially (`note` strings) | Standardize response format with explicit `success`, `server`, `database` keys | High |
| **MongoDB Connection (`db.js`)** | PARTIALLY IMPLEMENTED | Real | Attempted (Failing ECONNREFUSED) | No | Fix connection; provide embedded/local fallback for local dev when no host daemon is running; remove silent "offline/standby" acceptance | Critical |
| **Group / Subsidiary / Site Models** | NOT IMPLEMENTED | None | No | No | Create Mongoose schemas (`Group`, `Subsidiary`, `ProjectSite`) | High |
| **Sites Test API (`/api/sites`)** | NOT IMPLEMENTED | None | No | No | Create `GET /api/sites` querying `ProjectSite` Mongoose collection | High |
| **Seed Mechanism (`seedDatabase.js`)** | NOT IMPLEMENTED | None | No | No | Create `backend/seed/seedDatabase.js` and `npm run seed` script | High |
| **Diagnostics Page DB Test Section** | NOT IMPLEMENTED | None | No | No | Add live Database & Sites API test widget with dynamic count to Diagnostics UI | High |
| **User Authentication / JWT / Bcrypt** | NOT IMPLEMENTED | None | No | No | Phase 2 target - Do not build in Phase 1 | Future |
| **Role-Based Access Control (RBAC)** | UI ONLY | Mock labels in UI | No | Yes (role badges in LandingPage) | Phase 2 target - Do not build in Phase 1 | Future |
| **Site ESG Data Entry Form** | UI ONLY | Placeholder | No | No | Phase 3 target | Future |
| **BRSR Section A Disclosures** | UI ONLY | Informational cards | No | No | Phase 4 target | Future |
| **BRSR Section B (9 Principles)** | UI ONLY | Informational cards | No | No | Phase 4 target | Future |
| **BRSR Section C Performance** | UI ONLY | Informational cards | No | No | Phase 4 target | Future |
| **Backend Calculation Engine** | NOT IMPLEMENTED | None | No | No | Phase 5 target (Scope 1, intensities, recycling %) | Future |
| **Anomaly Detection Engine** | NOT IMPLEMENTED | None | No | No | Phase 5 target | Future |
| **Approval / Rejection Workflow** | NOT IMPLEMENTED | None | No | No | Phase 6 target | Future |
| **Site → Subsidiary → Group Rollup** | NOT IMPLEMENTED | None | No | No | Phase 7 target | Future |
| **Executive Analytics Charts** | NOT IMPLEMENTED | None | No | No | Phase 8 target | Future |
| **Compliance / Missing Field Audit** | NOT IMPLEMENTED | None | No | No | Phase 9 target | Future |
| **BRSR PDF Report Generation** | NOT IMPLEMENTED | None | No | No | Phase 10 target | Future |
| **SDG Mapping Matrix** | NOT IMPLEMENTED | None | No | No | Phase 11 target | Future |
| **Maturity Assessment Tool** | NOT IMPLEMENTED | None | No | No | Phase 12 target | Future |
| **AI Bill OCR & AI Assistant** | NOT IMPLEMENTED | None | No | No | Phase 13 & 14 target | Future |

---

## 2. Hardcoded & Mock Data Discovery and Classification

Each hardcoded item across the codebase has been identified and classified into:
- **A**: Acceptable static configuration
- **B**: Seed/demo data
- **C**: Must come from MongoDB
- **D**: Must be calculated by backend
- **E**: Temporary mock that must eventually be removed

| Item / Data Snippet | Location | Current Representation | Classification | Target Treatment |
| :--- | :--- | :--- | :---: | :--- |
| **Application Name & Subtitle** | `Navbar.jsx`, `LandingPage.jsx`, `index.html` | "ESG Reporting Portal - Centralized BRSR & Sustainability Data Management" | **A** | Retain as permanent branding metadata. |
| **Role Demo Emails** (`site@demo.com`, `subsidiary@demo.com`, `executive@demo.com`) | `LandingPage.jsx` | Plain static strings in feature cards | **B** | Move to `backend/seed/seedDatabase.js` during Phase 2. Keep on landing page only as informational preview of demo credentials. |
| **BRSR 9 Principles & Section Summaries** | `LandingPage.jsx` | Static cards outlining Sections A, B, and C | **A** | Retain as regulatory framework informational text. |
| **Port & API URLs** (`http://localhost:5000/api`, port `5173`) | `.env`, `.env.example`, `api.js` | Environment variables with sensible defaults | **A** | Retain in `.env` and `.env.example`. Ensure backend credentials are never exposed to frontend. |
| **Hardcoded "Vite Active" Label** | `LandingPage.jsx` (Diagnostics card) | Static badge `"Vite Active"` | **E** | Update diagnostics card to dynamically reflect real frontend runtime and real backend/DB API queries. |
| **"Offline / Standby" Fallback Mode** | `backend/src/config/db.js`, `healthController.js`, `api.js` | Accepts disconnected MongoDB and logs warning | **E** | Remove tolerant acceptance of disconnected state for data queries. Return explicit `503 Service Unavailable` with `{ success: false, message: "Database unavailable" }` on data routes when disconnected. |
| **Groups, Subsidiaries, and Project Sites** | Currently nonexistent in DB | Referenced only in architectural descriptions | **C** | Must be defined in Mongoose schemas (`Group`, `Subsidiary`, `ProjectSite`) and seeded into MongoDB via `npm run seed`. |
| **ESG Metrics (Emissions, Water, Waste, etc.)** | Currently nonexistent in DB | None (No fake ESG numbers exist yet) | **C & D** | Base inputs must come from MongoDB (`EnvironmentalData`, etc.); derived metrics (Scope 1 tCO2e, intensities) must be computed by backend calculation services in Phase 5. |

---

## 3. Root Cause of "MongoDB is disconnected"

1. **Host Environment Lack of Active Daemon**:
   - The backend was configured to connect to `mongodb://127.0.0.1:27017/esg_portal`.
   - On the host operating system, no local MongoDB daemon (`mongod`) process or Windows service was active on port 27017.
   - Consequently, Node.js received `ECONNREFUSED 127.0.0.1:27017`.
2. **Missing Automated Dev Runner**:
   - The project lacked an automatic embedded runner (`mongodb-memory-server`) or cloud cluster fallback for developer environments without a pre-installed system daemon.
3. **Environment Security Gap**:
   - Neither the root directory nor the `backend/` directory had `.gitignore` files, risking `.env` tracking.

---

## 4. Phase 1 Remediation Plan

1. **Environment Security**: Create `.gitignore` files in root and backend ensuring `.env` is never committed. Update `.env.example` with standard keys (`PORT`, `MONGO_URI`, etc.).
2. **Resilient & True MongoDB Connection**:
   - Update `backend/src/config/db.js` to connect to `MONGO_URI`.
   - If `MONGO_URI` is not provided or points to local and fails to connect, automatically spin up a dedicated embedded MongoDB daemon (`mongodb-memory-server`) so that a 100% real, authentic MongoDB server instance runs, responds to real Mongoose queries, and enables real collection indexing.
   - If configured with an external URI (Atlas or local mongod), connect directly to it.
3. **Mongoose Models**:
   - Create `Group.js` (`name`, `code`, `createdAt`).
   - Create `Subsidiary.js` (`name`, `code`, `groupId`, `createdAt`).
   - Create `ProjectSite.js` (`name`, `code`, `location`, `subsidiaryId`, `createdAt`).
4. **Seed Mechanism**:
   - Create `backend/seed/seedDatabase.js` and add `npm run seed` to `backend/package.json` to seed 1 Group, 3 Subsidiaries, and 6 Project Sites into MongoDB.
5. **Real Database Health & Sites API**:
   - Refactor `GET /api/health` to return:
     `{ success: true/false, server: "online", database: "connected"/"disconnected", host: "...", ... }`
   - Implement `GET /api/sites` to query the `ProjectSite` Mongoose collection and return `{ success: true, count: N, data: [...] }`.
   - When MongoDB is unavailable, return HTTP 503 `{ success: false, message: "Database unavailable" }` rather than mock data.
6. **Diagnostics UI Integration**:
   - Update `LandingPage.jsx` to fetch from both `/api/health` and `/api/sites`.
   - Display real MongoDB status: `Connected` (green) or `Disconnected` (red).
   - Display real site count queried from MongoDB.
