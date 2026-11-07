# Corporate ERP System – Backend API

This is the backend for the Corporate ERP System. It provides authenticated finance, employee directory, fleet vehicle, and procurement request APIs, with additional business workflows being added incrementally.

Built using **Node.js**, **Express.js**, and **MongoDB**, it supports secure authentication with JWT and bcrypt, and serves as the core logic layer for the full-stack Dhanbad app.

---

## 🚀 Features

- 🔐 User Registration & Login (JWT-based)
- 🔒 Password Hashing with bcrypt
- 💸 Add, Retrieve, and Delete Expenses
- 📅 Filter Expenses by Date and Category
- 📊 API to Fetch Expense Stats for Visualization
- 📁 Export Expenses as `.xlsx` using the `xlsx` library

---

## 🛠️ Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express.js  
- **Database:** MongoDB (via Mongoose)  
- **Authentication:** JWT, bcrypt  
- **Utilities:** dotenv, cors, xlsx, morgan

## Database demo data

`npm run seed:demo` runs a read-only dry run against `MONGO_URI`. It targets the
only existing user when the database has exactly one; otherwise, set
`SEED_USER_EMAIL` to an existing account. The script reuses the existing
Mongoose models, inserts only missing records, and never updates or deletes
records.

To insert records that the dry run reports as missing, run
`npm run seed:demo:apply` and confirm the displayed database name interactively.
The seed script verifies its records after insertion. Seed entries are labeled
`DEMO` so they can be distinguished from genuine business records., morgan

---
