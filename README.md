# Constructing the README.md content based on the extracted PPT text.
# The user's name from context is Tenzin Rigzin.

readme_content = """# Banking Management System (BMS)

A Database Management System (DBMS) powered full-stack web application that simulates core banking operations. The application enables users to create and manage customer accounts, process deposits and withdrawals, and securely store an auditable transaction history in a relational MySQL database.

---

## 🚀 Tech Stack

- **Frontend:** React.js (Port 3000)
- **Backend:** Node.js / Express (Port 4000)
- **Database:** MySQL (Port 3306)

---

## 📌 Project Overview & Architecture

BMS is a realistic banking simulator built to demonstrate robust DBMS-backed web application principles. It models an account lifecycle and transaction workflows backed by a relational database with strong constraints and ACID-safe operations.

The application follows a traditional **Three-Tier Architecture**:
1. **Presentation Layer (Frontend):** Built with React.js, featuring an interactive UI for account management, transaction forms, and data visualization timelines.
2. **Application Layer (Backend):** Built with Node.js and Express to expose RESTful API endpoints, manage business logic validations, and orchestrate strict database transactions.
3. **Data Layer (Database):** Uses MySQL to deliver relational storage with constraints, indexing, and absolute transactional isolation guarantees.

---

## 🗄️ Database Design & Schema

The core schema focuses on normalization and strict data integrity across relational tables (such as `accounts` and `transactions`). 

### Core Tables Structure
- **`accounts`**: Stores account metadata and current financials.
  - Columns: `id` (PK), `name`, `balance`, `created_at`
- **`transactions`**: An append-only ledger tracking every discrete balance modification.
  - Columns: `id` (PK), `account_id` (FK → `accounts.id`), `amount`, `type` (ENUM), `transaction_date`

---

## 🔒 Keys & Data Integrity Constraints

To ensure application state remains consistent under highly concurrent operations, business rules are directly enforced at the database level:

- **Primary Keys:** Every table includes an auto-incrementing `id` as a `PRIMARY KEY` to provide explicit unique indexing and optimized row joins.
- **Foreign Keys:** The ledger maps `transactions.account_id` to referentially target `accounts.id`. It implements an `ON DELETE CASCADE` rule to clear associated transaction chains when a parent test account is safely wiped.
- **Domain Constraints:** Field-level checks restrict critical inputs. Columns like `name`, `amount`, and `type` are configured as `NOT NULL`. Account `balance` defaults strictly to `0.00`, and all ledger actions record automated audit timestamps utilizing `CURRENT_TIMESTAMP`.
- **ENUM Restrictions:** The system enforces an `ENUM('DEPOSIT', 'WITHDRAW')` restriction on types, filtering out corrupt or unauthorized operations directly inside the storage engine.

---

## 📈 Transaction Handling & ACID Guardrails

All monetary modifications run inside isolated transactions to strictly comply with **ACID properties**:

- **Atomicity:** Ensures that the double-entry step—updating a customer's absolute balance and recording the historical ledger entry—succeeds completely or fails without partial mutations.
- **Consistency:** Validates state transitions using database-level rules and server validation before modifying the storage rows.
- **Isolation:** Employs explicit row-locking strategies (`SELECT ... FOR UPDATE`) to block parallel race conditions during heavy cross-deposits or withdrawals.
- **Durability:** Relies on the MySQL transaction engine to ensure committed records survive sudden service outages.

### Canonical Backend Transaction Pattern:
