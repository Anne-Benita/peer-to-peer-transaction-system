# P2P Money Transfer System (PayPal/MTN MoMo Edition)

A production-grade, full-stack digital wallet application. The backend is built in **Golang** using **Hexagonal Architecture** and the **Gin Web Framework** for fast, clean, and testable microservices. The frontend is a **mobile-first React.js** application styled with premium custom CSS inspired by **PayPal** and **MTN Mobile Money (MoMo)**.

---

## 🚀 Key Features
1. **User Authentication**: Secure registration and login using JWT access and refresh tokens, with password hashing via `bcrypt`.
2. **Personal Wallet & Balance Management**: Automatic wallet creation upon registration, supporting real-time balance inquiries and negative balance protection.
3. **P2P Money Transfers**: Secure, instant fund transfers using recipient's email or registered MTN Mobile Money phone number.
4. **MTN MoMo Simulation**: Simulated **Cash In** (deposit) and **Cash Out** (withdrawal) functionality using mock external MoMo gateway interfaces.
5. **ACID-Compliant Transactions**: Database-level locking (`SELECT ... FOR UPDATE`) and ACID transactions to ensure zero double-spending or data loss.
6. **Immutable Audit Trails**: Append-only audit logging recording all state-changing events (e.g. registration, logins, transfers).
7. **Mobile-First Responsive UI**: A premium dark-mode dashboard tailored for mobile viewports, featuring card-based components, visual receipt details, and smooth micro-animations.

---

## 🛠️ Technology Stack
* **Backend**: Golang (Gin, standard `database/sql` database pool with pgx driver)
* **Frontend**: React.js (Vite, Axios with token refresh interceptors, Vanilla CSS)
* **Database**: PostgreSQL 15 (ACID transaction safety, custom indexing, pgcrypto)
* **Packaging**: Docker & Docker Compose

---

## 📂 Hexagonal Architecture Directory Structure

The Go backend separates core business logic from external frameworks:

```text
backend/
├── cmd/
│   └── api/
│       └── main.go              # App entry point, migration runner, & wiring
├── config/
│   └── config.go                # Env-based configuration loader
├── internal/
│   ├── domain/                  # Core entities & business rules (zero external imports)
│   │   ├── user.go
│   │   ├── wallet.go
│   │   ├── transaction.go
│   │   ├── audit.go
│   │   └── errors.go
│   ├── ports/                   # Inbound and Outbound interfaces
│   │   ├── repositories.go      # Repository ports (outbound)
│   │   └── services.go          # Use case services ports (inbound)
│   ├── application/             # Use cases orchestration
│   │   ├── auth/
│   │   ├── wallet/
│   │   └── transfer/
│   └── adapters/
│       ├── http/                # Primary Adapter: Gin controllers & middleware
│       │   ├── router.go
│       │   ├── middleware/
│       │   └── handlers/
│       └── postgres/            # Secondary Adapter: SQL databases & repositories
└── pkg/
    ├── jwt/                     # JWT managers
    ├── hash/                    # password hashing
    ├── ref/                     # reference generators
    ├── logger/                  # Zerolog logger config
    └── response/                # standardized JSON responses
```

---

## 🗺️ API Documentation

All request and response payloads follow a standardized JSON envelope:
* **Success**: `{ "success": true, "message": "...", "data": { ... } }`
* **Error**: `{ "success": false, "message": "...", "error": { "code": "...", "details": "..." } }`

### Authentication Endpoints (Public)
* `POST /api/v1/auth/register` - Registers a new user and creates their wallet.
* `POST /api/v1/auth/login` - Verifies credentials; returns user object + access & refresh tokens.
* `POST /api/v1/auth/refresh` - Issues a new access token using a valid refresh token.

### Protected Wallet & Transfer Endpoints (Auth Required)
* `GET /api/v1/auth/me` - Retrieves the active user profile details.
* `GET /api/v1/wallets/me` - Gets the active user's wallet balance.
* `POST /api/v1/wallets/cash-in` - Simulates depositing money into the wallet from MTN MoMo.
* `POST /api/v1/wallets/cash-out` - Simulates withdrawing money from the wallet back to MTN MoMo.
* `POST /api/v1/transfers` - Transfers money to another user by email or registered MTN phone number.
* `GET /api/v1/transfers` - Lists paginated transaction logs.
* `GET /api/v1/transfers/:txId` - Retrieves detail for a single transaction.

---

## ⚙️ Quick Start (Running via Docker Compose)

To run the entire ecosystem (React UI, Go Backend, and PostgreSQL database) with a single command:

1. Ensure **Docker Desktop** is running.
2. In the root directory of this repository, run:
   ```bash
   docker-compose up --build
   ```
3. Access the services:
   * **Frontend Application**: [http://localhost:5173](http://localhost:5173)
   * **Backend API server**: [http://localhost:8080](http://localhost:8080)
   * **Health Check endpoint**: [http://localhost:8080/health](http://localhost:8080/health)

---

## 🧪 Local Manual Execution (Without Docker)

### 1. Database Setup
Spin up PostgreSQL locally and execute the SQL migrations in `backend/migrations/001_init_schema.up.sql`.

### 2. Running Backend (Go)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build and run:
   ```bash
   go run cmd/api/main.go
   ```

### 3. Running Frontend (React)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Run Vite server:
   ```bash
   npm run dev
   ```
