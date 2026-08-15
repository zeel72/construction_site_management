# 🏗️ Construction Site Management System (CSMS)

A full-stack web application to manage construction site operations — **labour attendance**, **material inventory with GST billing**, and **payment tracking**.

---

## Tech Stack

| Layer      | Technology            |
|------------|-----------------------|
| Frontend   | React.js (Vite)       |
| Backend    | Node.js + Express.js  |
| Database   | MongoDB (Mongoose)    |
| Auth       | JWT                   |
| Styling    | Vanilla CSS           |

---

## Project Structure

```
construction_site_management/
├── client/          # React frontend (Vite)
├── server/          # Node.js + Express backend
├── .env.example     # Environment variable template
├── .gitignore
├── prd.md           # Product Requirements Document
├── implementation_plan.md
└── README.md        # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local or Atlas)
- **npm** (v9 or higher)

### 1. Clone the repository

```bash
git clone <repo-url>
cd construction_site_management
```

### 2. Setup the Backend

```bash
cd server
cp ../.env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

The server will start on `http://localhost:5000`

### 3. Setup the Frontend

```bash
cd client
npm install
npm run dev
```

The client will start on `http://localhost:5173`

---

## Available Scripts

### Server

| Script         | Command            | Description                  |
|----------------|--------------------|------------------------------|
| `npm start`    | `node server.js`   | Start production server      |
| `npm run dev`  | `nodemon server.js`| Start dev server with reload |

### Client

| Script         | Command            | Description                  |
|----------------|--------------------|------------------------------|
| `npm run dev`  | `vite`             | Start dev server             |
| `npm run build`| `vite build`       | Build for production         |
| `npm run preview`| `vite preview`   | Preview production build     |

---

## API Base URL

```
http://localhost:5000/api
```

### Core Endpoints

| Module        | Base Path                              |
|---------------|----------------------------------------|
| Auth          | `/api/auth`                            |
| Sites         | `/api/sites`                           |
| Labours       | `/api/sites/:siteId/labours`           |
| Attendance    | `/api/sites/:siteId/attendance`        |
| Materials     | `/api/sites/:siteId/materials`         |
| Material Bills| `/api/sites/:siteId/material-bills`    |
| Suppliers     | `/api/suppliers`                       |
| Payments      | `/api/sites/:siteId/payments`          |
| Dashboard     | `/api/sites/:siteId/dashboard`         |
| Reports       | `/api/sites/:siteId/reports`           |

---

## Environment Variables

See [.env.example](.env.example) for all required variables.

---

## License

ISC
