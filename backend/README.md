# Backend Architecture (Phase 1 Setup)

This directory contains backend modules organized cleanly for the Corporate ESG Reporting Portal:

- `src/config/`: Database and environment configuration.
- `src/controllers/`: Route handlers for API endpoints.
- `src/routes/`: Express route definitions.
- `src/models/`: Mongoose schemas (User, Group, Subsidiary, Site, ESGSubmission, etc.).
- `src/middleware/`: Auth, role verification, and error middleware.
- `src/services/`: Business logic and external service integrations.
- `src/calculations/`: ESG & BRSR calculation engine (Scope 1, intensities, recycling rate).
- `src/validators/`: Input validation and anomaly detection rules.
- `src/utils/`: Helper utilities and formatters.
