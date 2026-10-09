# Corporate ESG Reporting Portal
> **Centralized BRSR & Sustainability Data Management**  
> *A modular, multi-tier enterprise hackathon prototype aligned with SEBI BRSR guidelines.*

---

## 📌 Phase 1: Project Setup & Architecture Completed

This repository contains the foundation for the **Corporate ESG Reporting Portal**, designed to demonstrate end-to-end ESG/BRSR data collection, validation, automatic calculation, multi-tier approval, subsidiary-to-group rollup aggregation, executive analytics, compliance verification, and PDF report generation.

---

## 🏛️ System Architecture

```text
React (Vite + Tailwind CSS + React Router) [Port 5173]
                    ↓ REST API
Node.js + Express.js API Gateway [Port 5000]
                    ↓ Mongoose
      MongoDB (Local / Atlas Cloud)
```

### 3-Tier Enterprise Role Model (Targeted for Phase 2):
1. **Site Manager (`SITE_MANAGER`)**: Project/site-level ESG data entry (Energy, Water, Waste, Social, Governance), drafts, and submission.
2. **Subsidiary ESG Manager (`SUBSIDIARY_ESG_MANAGER`)**: Audit, historical anomaly detection review, and approve/reject site submissions.
3. **Group ESG Executive (`GROUP_ESG_EXECUTIVE`)**: Conglomerate rollup analytics, BRSR compliance check, and official PDF report generation.

---

## 📂 Project Directory Structure

```text
BPUT Hackathon/
├── package.json              # Top-level orchestrator scripts
├── README.md                 # Setup & verification guide
│
├── backend/                  # Node.js + Express REST API
│   ├── package.json
│   ├── .env                  # Backend environment configuration
│   ├── .env.example
│   └── src/
│       ├── server.js         # HTTP server entry point
│       ├── app.js            # Express app configuration & middleware
│       ├── config/
│       │   └── db.js         # MongoDB connection & status tracker
│       ├── controllers/
│       │   └── healthController.js # API & DB health check
│       ├── routes/
│       │   └── healthRoutes.js     # Health route (/api/health)
│       ├── models/           # Mongoose schemas (Phase 2+)
│       ├── middleware/       # JWT & RBAC middleware (Phase 2+)
│       ├── services/         # Rollup & workflow logic
│       ├── calculations/     # Scope 1, intensities, recycling engine
│       ├── validators/       # Input validation & anomaly detection
│       └── utils/            # Helper utilities
│
└── frontend/                 # React + Vite + Tailwind CSS Application
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js    # Enterprise ESG teal color system
    ├── postcss.config.js
    ├── index.html            # Portal metadata & typography
    ├── .env                  # Frontend environment configuration
    ├── .env.example
    └── src/
        ├── main.jsx          # React DOM entry
        ├── App.jsx           # React Router DOM & status provider
        ├── index.css         # Tailwind & typography styling
        ├── components/
        │   ├── Navbar.jsx    # Sticky navigation with live API/DB badge
        │   └── Footer.jsx    # Corporate metadata footer
        ├── layouts/
        │   └── MainLayout.jsx # Standard enterprise layout wrapper
        ├── pages/
        │   ├── LandingPage.jsx  # System health, RBAC preview, pipeline
        │   └── NotFoundPage.jsx # Clean 404 handler
        ├── services/
        │   └── api.js        # Centralized fetch API client
        ├── auth/             # Context & protected routes (Phase 2)
        ├── hooks/            # Custom reusable hooks
        ├── charts/           # Recharts components (Phase 8)
        └── utils/            # Formatters and conversions
```

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies

Open a terminal in the project root:

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2: Configure Environment Variables

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/esg_portal
CLIENT_URL=http://localhost:5173
JWT_SECRET=esg_reporting_portal_super_secret_hackathon_key_2026
```

#### Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

---

### Step 3: Run the Backend Server

From the project root:

```bash
npm run dev:backend
# Or directly from backend folder:
# cd backend && npm run dev
```

*Output:*
```text
====================================================
ESG Reporting Portal Backend (Phase 1)
Server listening on: http://localhost:5000
Health Check:        http://localhost:5000/api/health
Environment:         development
====================================================
```

---

### Step 4: Run the Frontend Application

Open a second terminal window in the project root:

```bash
npm run dev:frontend
# Or directly from frontend folder:
# cd frontend && npm run dev
```

*Frontend URL:* [http://localhost:5173](http://localhost:5173)

---

## 🍃 MongoDB Connection Guide

The backend includes a graceful MongoDB connection handler:

1. **Local MongoDB**:
   - Ensure the MongoDB service or `mongod` daemon is running on port `27017`.
   - The default `MONGO_URI=mongodb://127.0.0.1:27017/esg_portal` will connect automatically.

2. **MongoDB Atlas (Cloud)**:
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
   - In `backend/.env`, replace `MONGO_URI` with your connection string:
     ```env
     MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/esg_portal?retryWrites=true&w=majority
     ```

3. **Offline / Standby Mode**:
   - If MongoDB is not yet running, the backend server will **not crash**.
   - It runs in resilient standby mode and reports `DB: Offline Mode` on the frontend header and health check until MongoDB is connected.

---

## ✅ How to Verify the Setup

1. **Backend Health Endpoint**:
   - Open [http://localhost:5000/api/health](http://localhost:5000/api/health) in your browser or via curl.
   - It returns a JSON response containing `status: "online"`, server uptime, environment, and database state.

2. **Frontend Portal Interface**:
   - Open [http://localhost:5173](http://localhost:5173).
   - Look at the top navigation bar:
     - `API: Active` badge (green pulse).
     - `DB: Connected` (green) or `DB: Offline Mode` (amber).
   - Check the **Full-Stack Health & Connectivity Diagnostics** card to view live real-time sync with the backend.
   - Click the "Refresh Diagnostics" button to re-test the live API connection.

---

## ⏩ Next Phase: Phase 2 — Authentication & RBAC

With Phase 1 complete, the foundation is ready for:
- JWT Authentication & bcrypt password hashing
- Seeded demo users (`site@demo.com`, `subsidiary@demo.com`, `executive@demo.com`)
- Protected routes and role-based redirects (`/site-dashboard`, `/subsidiary-dashboard`, `/group-dashboard`)
