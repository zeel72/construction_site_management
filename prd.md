# 🏗️ Construction Site Management — Product Requirements Document (PRD)

---

## 1. Overview

### 1.1 Product Name
**Construction Site Management System (CSMS)**

### 1.2 Purpose
A full-stack web application to help construction site owners, contractors, and supervisors manage **daily labour attendance & updates**, **material inventory & procurement**, and **payment tracking** — all from a single, unified dashboard.

### 1.3 Tech Stack

| Layer        | Technology              |
|-------------|-------------------------|
| Frontend    | React.js (Vite)         |
| Backend     | Node.js + Express.js    |
| Database    | MongoDB (Mongoose ODM)  |
| Auth        | JWT (JSON Web Tokens)   |
| File Upload | Multer / Cloudinary     |
| Styling     | Vanilla CSS (custom)    |

### 1.4 Target Users

| Role           | Description                                                  |
|----------------|--------------------------------------------------------------|
| **Admin**      | Site owner / main contractor — full access to everything     |
| **Supervisor** | On-site manager — manages daily labour & material entries    |
| **Viewer**     | Stakeholder / accountant — read-only access to reports       |

---

## 2. Problem Statement

Construction site managers currently rely on **paper registers, WhatsApp messages, and Excel sheets** to track:
- Which labourers worked on which day and how many hours
- What materials were ordered, received, and consumed
- How much payment is due to labourers and material suppliers

This leads to **data loss, payment disputes, inventory mismatches, and zero visibility** into project costs. CSMS solves this by digitizing the entire workflow.

---

## 3. Core Modules

### 3.1 🔐 Authentication & Authorization

#### Features
- User registration with role assignment (Admin, Supervisor, Viewer)
- Login / Logout with JWT-based session management
- Password hashing with bcrypt
- Role-based access control (RBAC) middleware
- Password reset via email (optional — Phase 2)

#### API Endpoints

| Method | Endpoint              | Description              | Access   |
|--------|-----------------------|--------------------------|----------|
| POST   | `/api/auth/register`  | Register a new user      | Public   |
| POST   | `/api/auth/login`     | Login & receive JWT      | Public   |
| GET    | `/api/auth/me`        | Get logged-in user info  | All      |
| PUT    | `/api/auth/password`  | Change password          | All      |

#### Data Model — `User`

```json
{
  "_id": "ObjectId",
  "name": "String (required)",
  "email": "String (required, unique)",
  "phone": "String (required)",
  "password": "String (hashed, required)",
  "role": "String (enum: admin, supervisor, viewer)",
  "avatar": "String (URL, optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

### 3.2 🏗️ Site Management

#### Features
- Create and manage multiple construction sites/projects
- Each site has its own labourers, materials, and payment records
- Track site status (Active, On Hold, Completed)
- Dashboard summary per site

#### API Endpoints

| Method | Endpoint            | Description             | Access          |
|--------|---------------------|-------------------------|-----------------|
| POST   | `/api/sites`        | Create a new site       | Admin           |
| GET    | `/api/sites`        | List all sites          | All             |
| GET    | `/api/sites/:id`    | Get site details        | All             |
| PUT    | `/api/sites/:id`    | Update site info        | Admin           |
| DELETE | `/api/sites/:id`    | Delete a site           | Admin           |

#### Data Model — `Site`

```json
{
  "_id": "ObjectId",
  "name": "String (required)",
  "location": "String (required)",
  "description": "String",
  "clientName": "String",
  "clientPhone": "String",
  "startDate": "Date (required)",
  "expectedEndDate": "Date",
  "status": "String (enum: active, on_hold, completed) — default: active",
  "totalBudget": "Number",
  "createdBy": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

### 3.3 👷 Labour Management

#### Features
- **Labour Registry**: Add labourers with name, phone, skill type, and daily wage
- **Daily Attendance**: Mark attendance (Present / Absent / Half Day) with date
- **Work Log**: Record what work each labourer did on a given day
- **Overtime Tracking**: Log extra hours beyond the standard shift
- **Labour Summary**: View total days worked, total wages earned, payments made, and balance due

#### API Endpoints

| Method | Endpoint                                  | Description                        | Access              |
|--------|-------------------------------------------|------------------------------------|---------------------|
| POST   | `/api/sites/:siteId/labours`              | Add a labourer to a site           | Admin, Supervisor   |
| GET    | `/api/sites/:siteId/labours`              | List all labourers for a site      | All                 |
| GET    | `/api/sites/:siteId/labours/:id`          | Get labourer details               | All                 |
| PUT    | `/api/sites/:siteId/labours/:id`          | Update labourer info               | Admin, Supervisor   |
| DELETE | `/api/sites/:siteId/labours/:id`          | Remove a labourer                  | Admin               |
| POST   | `/api/sites/:siteId/attendance`           | Mark daily attendance (bulk)       | Admin, Supervisor   |
| GET    | `/api/sites/:siteId/attendance`           | Get attendance records (filterable)| All                 |
| PUT    | `/api/sites/:siteId/attendance/:id`       | Update an attendance record        | Admin, Supervisor   |
| GET    | `/api/sites/:siteId/labours/:id/summary`  | Get labourer wage summary          | All                 |

#### Data Model — `Labour`

```json
{
  "_id": "ObjectId",
  "name": "String (required)",
  "phone": "String",
  "skill": "String (enum: mason, carpenter, plumber, electrician, painter, helper, other)",
  "dailyWage": "Number (required)",
  "overtimeRate": "Number (per hour)",
  "address": "String",
  "aadharNumber": "String (optional, for Indian context)",
  "photo": "String (URL, optional)",
  "siteId": "ObjectId (ref: Site, required)",
  "isActive": "Boolean (default: true)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Data Model — `Attendance`

```json
{
  "_id": "ObjectId",
  "labourId": "ObjectId (ref: Labour, required)",
  "siteId": "ObjectId (ref: Site, required)",
  "date": "Date (required)",
  "status": "String (enum: present, absent, half_day) — required",
  "overtimeHours": "Number (default: 0)",
  "workDescription": "String (what work was done)",
  "wageForDay": "Number (auto-calculated based on status & overtime)",
  "markedBy": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

> **Wage Calculation Logic:**
> - `present` → `dailyWage + (overtimeHours × overtimeRate)`
> - `half_day` → `dailyWage / 2`
> - `absent` → `0`

---

### 3.4 📦 Material Management

#### Features
- **Material Registry**: Add material types (cement, sand, bricks, steel, etc.)
- **Material Entries**: Log material received at site — quantity, unit, rate, supplier, date, and invoice
- **Material Billing with GST**: Generate proper bills for material purchases with full GST breakdown
  - Support for **CGST + SGST** (intra-state) and **IGST** (inter-state)
  - Auto-calculate tax amounts based on GST rate (5%, 12%, 18%, 28%)
  - Track **HSN codes** for each material item
  - Store supplier GSTIN for input tax credit (ITC) claims
  - Generate bill summary with **subtotal, discount, taxable amount, GST breakup, and grand total**
  - Bill status tracking (Draft → Pending → Paid → Partially Paid)
- **Material Usage**: Track daily material consumption (optional — Phase 2)
- **Supplier Management**: Maintain a supplier directory with contact details & GST registration
- **Stock Summary**: Current stock = Total Received − Total Used
- **GST Reports**: GSTR-compliant purchase summaries with tax breakdowns

#### API Endpoints — Materials

| Method | Endpoint                                    | Description                         | Access              |
|--------|---------------------------------------------|-------------------------------------|---------------------|
| POST   | `/api/sites/:siteId/materials`              | Add a material entry                | Admin, Supervisor   |
| GET    | `/api/sites/:siteId/materials`              | List all material entries           | All                 |
| GET    | `/api/sites/:siteId/materials/:id`          | Get material entry details          | All                 |
| PUT    | `/api/sites/:siteId/materials/:id`          | Update material entry               | Admin, Supervisor   |
| DELETE | `/api/sites/:siteId/materials/:id`          | Delete material entry               | Admin               |
| GET    | `/api/sites/:siteId/materials/summary`      | Get material stock summary          | All                 |

#### API Endpoints — Material Bills (GST)

| Method | Endpoint                                           | Description                              | Access              |
|--------|------------------------------------------------------|------------------------------------------|---------------------|
| POST   | `/api/sites/:siteId/material-bills`                 | Create a new material bill               | Admin, Supervisor   |
| GET    | `/api/sites/:siteId/material-bills`                 | List all bills (with filters)            | All                 |
| GET    | `/api/sites/:siteId/material-bills/:id`             | Get bill details with GST breakup        | All                 |
| PUT    | `/api/sites/:siteId/material-bills/:id`             | Update bill details                      | Admin, Supervisor   |
| DELETE | `/api/sites/:siteId/material-bills/:id`             | Delete a bill                            | Admin               |
| PATCH  | `/api/sites/:siteId/material-bills/:id/status`      | Update bill status (paid/partially paid) | Admin               |
| GET    | `/api/sites/:siteId/material-bills/gst-summary`     | GST-wise purchase summary for reporting  | All                 |

#### API Endpoints — Suppliers

| Method | Endpoint                                    | Description                         | Access              |
|--------|---------------------------------------------|-------------------------------------|---------------------|
| POST   | `/api/suppliers`                            | Add a supplier                      | Admin, Supervisor   |
| GET    | `/api/suppliers`                            | List all suppliers                  | All                 |
| GET    | `/api/suppliers/:id`                        | Get supplier details                | All                 |
| PUT    | `/api/suppliers/:id`                        | Update supplier                     | Admin, Supervisor   |
| DELETE | `/api/suppliers/:id`                        | Delete supplier                     | Admin               |

#### Data Model — `Material`

```json
{
  "_id": "ObjectId",
  "name": "String (required) — e.g., Cement, Sand, Bricks",
  "category": "String (enum: cement, sand, aggregate, bricks, steel, wood, plumbing, electrical, paint, other)",
  "hsnCode": "String (optional — HSN/SAC code for GST classification)",
  "quantity": "Number (required)",
  "unit": "String (enum: bags, kg, tons, cubic_ft, cubic_m, pieces, liters, meters, sq_ft) — required",
  "ratePerUnit": "Number (required)",
  "totalAmount": "Number (auto: quantity × ratePerUnit)",
  "gstRate": "Number (enum: 0, 5, 12, 18, 28) — GST percentage applicable",
  "supplierId": "ObjectId (ref: Supplier)",
  "supplierName": "String",
  "billId": "ObjectId (ref: MaterialBill, optional — linked bill)",
  "invoiceNumber": "String",
  "invoiceImage": "String (URL, optional — photo of bill/invoice)",
  "receivedDate": "Date (required)",
  "siteId": "ObjectId (ref: Site, required)",
  "notes": "String",
  "addedBy": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

#### Data Model — `MaterialBill`

```json
{
  "_id": "ObjectId",
  "billNumber": "String (required, unique — auto-generated e.g., BILL-2026-0001)",
  "siteId": "ObjectId (ref: Site, required)",
  "supplierId": "ObjectId (ref: Supplier, required)",
  "supplierName": "String",
  "supplierGstin": "String (copied from supplier for record)",
  "billDate": "Date (required)",
  "dueDate": "Date (optional — payment due date)",
  "items": [
    {
      "materialId": "ObjectId (ref: Material)",
      "name": "String",
      "hsnCode": "String",
      "quantity": "Number",
      "unit": "String",
      "ratePerUnit": "Number",
      "amount": "Number (quantity × ratePerUnit)",
      "gstRate": "Number (enum: 0, 5, 12, 18, 28)"
    }
  ],
  "subtotal": "Number (sum of all item amounts)",
  "discountPercent": "Number (default: 0)",
  "discountAmount": "Number (auto: subtotal × discountPercent / 100)",
  "taxableAmount": "Number (subtotal − discountAmount)",
  "gstBreakup": {
    "isInterState": "Boolean (default: false — true = IGST, false = CGST+SGST)",
    "cgstAmount": "Number (auto-calculated — only for intra-state)",
    "sgstAmount": "Number (auto-calculated — only for intra-state)",
    "igstAmount": "Number (auto-calculated — only for inter-state)",
    "totalGstAmount": "Number (cgst + sgst OR igst)",
    "rateWiseBreakup": [
      {
        "gstRate": "Number (5, 12, 18, 28)",
        "taxableAmount": "Number",
        "cgst": "Number",
        "sgst": "Number",
        "igst": "Number",
        "totalTax": "Number"
      }
    ]
  },
  "grandTotal": "Number (taxableAmount + totalGstAmount)",
  "roundOff": "Number (optional — rounding adjustment)",
  "finalAmount": "Number (grandTotal + roundOff)",
  "paidAmount": "Number (default: 0 — updated when payments are linked)",
  "balanceAmount": "Number (auto: finalAmount − paidAmount)",
  "status": "String (enum: draft, pending, paid, partially_paid, cancelled) — default: pending",
  "invoiceImage": "String (URL, optional — scanned copy of supplier invoice)",
  "notes": "String",
  "createdBy": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

> **GST Calculation Logic:**
>
> | Scenario       | Tax Computation                                                    |
> |----------------|--------------------------------------------------------------------|
> | Intra-State    | `CGST = taxableAmount × gstRate / 2 / 100`                        |
> |                | `SGST = taxableAmount × gstRate / 2 / 100`                        |
> | Inter-State    | `IGST = taxableAmount × gstRate / 100`                            |
> | Grand Total    | `taxableAmount + totalGstAmount`                                  |
> | Balance        | `finalAmount − sum(linked payments)`                              |
>
> **HSN Code Examples (Construction Materials):**
>
> | Material       | HSN Code | GST Rate |
> |----------------|----------|----------|
> | Cement         | 2523     | 28%      |
> | Sand           | 2505     | 5%       |
> | Bricks         | 6901     | 5%       |
> | TMT Steel Bars | 7214     | 18%      |
> | Paint          | 3208     | 28%      |
> | PVC Pipes      | 3917     | 18%      |
> | Electrical Wire| 8544     | 18%      |
> | Wood / Timber  | 4407     | 18%      |

#### Data Model — `Supplier`

```json
{
  "_id": "ObjectId",
  "name": "String (required)",
  "phone": "String (required)",
  "email": "String",
  "address": "String",
  "city": "String",
  "state": "String (required — needed for CGST/SGST vs IGST determination)",
  "pincode": "String",
  "gstin": "String (optional — 15-digit GSTIN for Indian GST)",
  "isGstRegistered": "Boolean (default: false)",
  "panNumber": "String (optional)",
  "materialTypes": ["String — what they supply"],
  "bankDetails": {
    "bankName": "String",
    "accountNumber": "String",
    "ifscCode": "String",
    "accountHolderName": "String"
  },
  "totalBilled": "Number (auto: sum of all bills)",
  "totalPaid": "Number (auto: sum of all payments)",
  "balanceDue": "Number (auto: totalBilled − totalPaid)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

---

### 3.5 💰 Payment Management

#### Features
- **Labour Payments**: Record payments made to labourers (partial or full)
- **Material/Supplier Payments**: Record payments made to material suppliers
- **Payment Modes**: Cash, UPI, Bank Transfer, Cheque
- **Payment History**: Filterable log of all payments with date range
- **Outstanding Summary**: View pending amounts for each labourer and supplier
- **Receipt Upload**: Attach payment proof (photo of receipt/screenshot)

#### API Endpoints

| Method | Endpoint                                    | Description                           | Access              |
|--------|---------------------------------------------|---------------------------------------|---------------------|
| POST   | `/api/sites/:siteId/payments`               | Record a new payment                  | Admin, Supervisor   |
| GET    | `/api/sites/:siteId/payments`               | List all payments (with filters)      | All                 |
| GET    | `/api/sites/:siteId/payments/:id`           | Get payment details                   | All                 |
| PUT    | `/api/sites/:siteId/payments/:id`           | Update payment record                 | Admin               |
| DELETE | `/api/sites/:siteId/payments/:id`           | Delete payment record                 | Admin               |
| GET    | `/api/sites/:siteId/payments/summary`       | Get payment summary & outstanding     | All                 |

#### Data Model — `Payment`

```json
{
  "_id": "ObjectId",
  "type": "String (enum: labour, material) — required",
  "referenceId": "ObjectId (ref: Labour or Supplier) — required",
  "referenceName": "String (labourer or supplier name)",
  "siteId": "ObjectId (ref: Site, required)",
  "amount": "Number (required)",
  "paymentDate": "Date (required)",
  "paymentMode": "String (enum: cash, upi, bank_transfer, cheque) — required",
  "transactionId": "String (optional — UPI/bank ref number)",
  "receiptImage": "String (URL, optional — payment proof)",
  "notes": "String",
  "paidBy": "ObjectId (ref: User)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

> **Outstanding Calculation:**
> - **Labour**: `Sum of all wageForDay (from Attendance)` − `Sum of all Payments where type=labour`
> - **Material/Supplier**: `Sum of all totalAmount (from Materials)` − `Sum of all Payments where type=material`

---

### 3.6 📊 Dashboard & Reports

#### Features
- **Site Dashboard**: At-a-glance summary for each site
  - Total labourers active today
  - Today's attendance count (present / absent / half day)
  - Total material cost to date
  - Total labour cost to date
  - Total payments made vs outstanding
  - Budget utilization percentage
- **Reports** (filterable by date range):
  - Daily attendance report
  - Monthly labour cost report
  - Material purchase report
  - **GST summary report** (CGST/SGST/IGST totals, rate-wise breakup)
  - **Supplier-wise bill & payment report**
  - Payment ledger report
  - Supplier-wise payment report
- **Export**: Download reports as CSV/PDF (Phase 2)

#### API Endpoints

| Method | Endpoint                                       | Description                       | Access |
|--------|-------------------------------------------------|-----------------------------------|--------|
| GET    | `/api/sites/:siteId/dashboard`                 | Get dashboard summary data        | All    |
| GET    | `/api/sites/:siteId/reports/attendance`        | Attendance report with filters    | All    |
| GET    | `/api/sites/:siteId/reports/labour-cost`       | Labour cost report                | All    |
| GET    | `/api/sites/:siteId/reports/material-cost`     | Material cost report              | All    |
| GET    | `/api/sites/:siteId/reports/gst-summary`       | GST summary (CGST/SGST/IGST)     | All    |
| GET    | `/api/sites/:siteId/reports/payments`          | Payment ledger                    | All    |

---

## 4. Non-Functional Requirements

### 4.1 Security
- All passwords hashed with **bcrypt** (salt rounds ≥ 10)
- JWT tokens with **expiry** (e.g., 7 days)
- Input validation and sanitization on all API endpoints (using `express-validator` or `joi`)
- Rate limiting on auth endpoints to prevent brute force
- CORS configured to allow only the frontend origin
- Environment variables for all secrets (`.env` file, never committed)

### 4.2 Performance
- MongoDB indexes on frequently queried fields (`siteId`, `date`, `labourId`, `supplierId`)
- Pagination on all list endpoints (default: 20 items per page)
- Lean queries where full document hydration is unnecessary
- Frontend lazy loading for route-based code splitting

### 4.3 Responsiveness
- Fully responsive design — works on **desktop, tablet, and mobile**
- Mobile-first approach for field use by supervisors on-site
- Touch-friendly UI elements for attendance marking

### 4.4 Error Handling
- Centralized error handling middleware in Express
- Consistent error response format:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "statusCode": 400
}
```
- Frontend toast notifications for API errors

---

## 5. Project Structure

```
construction_site_management/
├── client/                        # React Frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── assets/                # Images, icons, fonts
│   │   ├── components/            # Reusable UI components
│   │   │   ├── common/            # Button, Input, Modal, Table, Card
│   │   │   ├── layout/            # Navbar, Sidebar, Footer
│   │   │   └── forms/             # Labour form, Material form, etc.
│   │   ├── pages/                 # Route-level page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Sites.jsx
│   │   │   ├── SiteDetail.jsx
│   │   │   ├── Labours.jsx
│   │   │   ├── LabourDetail.jsx
│   │   │   ├── Attendance.jsx
│   │   │   ├── Materials.jsx
│   │   │   ├── MaterialBills.jsx
│   │   │   ├── MaterialBillDetail.jsx
│   │   │   ├── Suppliers.jsx
│   │   │   ├── Payments.jsx
│   │   │   └── Reports.jsx
│   │   ├── context/               # React Context for auth & global state
│   │   ├── hooks/                 # Custom hooks (useAuth, useFetch, etc.)
│   │   ├── services/              # API service functions (axios)
│   │   ├── utils/                 # Helper functions, constants
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css              # Global styles & design tokens
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                        # Node.js + Express Backend
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── siteController.js
│   │   ├── labourController.js
│   │   ├── attendanceController.js
│   │   ├── materialController.js
│   │   ├── materialBillController.js
│   │   ├── supplierController.js
│   │   ├── paymentController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js                # JWT verification middleware
│   │   ├── roleCheck.js           # Role-based access control
│   │   ├── errorHandler.js        # Centralized error handler
│   │   └── validate.js            # Request validation middleware
│   ├── models/
│   │   ├── User.js
│   │   ├── Site.js
│   │   ├── Labour.js
│   │   ├── Attendance.js
│   │   ├── Material.js
│   │   ├── MaterialBill.js
│   │   ├── Supplier.js
│   │   └── Payment.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── siteRoutes.js
│   │   ├── labourRoutes.js
│   │   ├── attendanceRoutes.js
│   │   ├── materialRoutes.js
│   │   ├── materialBillRoutes.js
│   │   ├── supplierRoutes.js
│   │   ├── paymentRoutes.js
│   │   └── dashboardRoutes.js
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── calculateWage.js
│   │   └── calculateGst.js        # GST calculation helper
│   ├── server.js                  # Express app entry point
│   └── package.json
│
├── .env.example                   # Environment variable template
├── .gitignore
├── prd.md                         # This file
└── README.md
```

---

## 6. UI Pages & Screens

| #  | Page                | Key Elements                                                                                     |
|----|---------------------|--------------------------------------------------------------------------------------------------|
| 1  | **Login**           | Email, password fields, login button, link to register                                           |
| 2  | **Register**        | Name, email, phone, password, role selection                                                     |
| 3  | **Dashboard**       | Site selector, summary cards (labourers, attendance, costs, payments), quick actions              |
| 4  | **Sites List**      | Table/card grid of all sites with status badges, search, add button                              |
| 5  | **Site Detail**     | Site info, tabs for Labours / Materials / Payments / Reports                                     |
| 6  | **Labours**         | Labourer table with search/filter, add/edit modal, skill badges                                  |
| 7  | **Labour Detail**   | Profile card, attendance history, wage summary, payment history                                  |
| 8  | **Attendance**      | Date picker, bulk attendance marking grid (checkboxes), save button                              |
| 9  | **Materials**       | Material entries table, filters by category/supplier/date, add entry form                        |
| 10 | **Suppliers**       | Supplier directory, contact details, payment outstanding                                         |
| 11 | **Payments**        | Payment log table, filters (type, mode, date), add payment form with receipt upload              |
| 12 | **Reports**         | Date range selector, report type tabs, data tables, summary cards                                |

---

## 7. Phase Plan

### Phase 1 — MVP (Core)
- [ ] Auth (Register, Login, JWT, RBAC)
- [ ] Site CRUD
- [ ] Labour CRUD + Attendance marking
- [ ] Material CRUD
- [ ] Supplier CRUD
- [ ] Payment recording (Labour + Material)
- [ ] Dashboard with summary cards
- [ ] Basic reports (attendance, costs)

### Phase 2 — Enhanced
- [ ] Material usage tracking (daily consumption log)
- [ ] Export reports as CSV / PDF
- [ ] Password reset via email (nodemailer)
- [ ] Image upload for invoices & receipts (Cloudinary)
- [ ] Advanced filtering & search across all modules
- [ ] Notification system (payment reminders, low stock alerts)

### Phase 3 — Advanced
- [ ] Multi-tenant support (multiple companies)
- [ ] Mobile app (React Native)
- [ ] Daily photo log of construction progress
- [ ] WhatsApp integration for sending daily reports
- [ ] GPS-based attendance (geofencing)
- [ ] Expense categories & budget tracking per category
- [ ] Audit log (who changed what and when)

---

## 8. Environment Variables

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/construction_site_db

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Cloudinary (Phase 2)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Frontend
VITE_API_URL=http://localhost:5000/api
```

---

## 9. Dependencies

### Server (`server/package.json`)

| Package              | Purpose                          |
|----------------------|----------------------------------|
| express              | Web framework                    |
| mongoose             | MongoDB ODM                      |
| bcryptjs             | Password hashing                 |
| jsonwebtoken         | JWT generation & verification    |
| dotenv               | Environment variable management  |
| cors                 | Cross-origin resource sharing    |
| express-validator    | Input validation                 |
| multer               | File upload handling             |
| morgan               | HTTP request logging             |
| helmet               | Security headers                 |
| express-rate-limit   | Rate limiting                    |

### Client (`client/package.json`)

| Package              | Purpose                          |
|----------------------|----------------------------------|
| react                | UI library                       |
| react-dom            | DOM rendering                    |
| react-router-dom     | Client-side routing              |
| axios                | HTTP client                      |
| react-icons          | Icon library                     |
| react-toastify       | Toast notifications              |
| react-datepicker     | Date picker component            |
| chart.js             | Dashboard charts                 |
| react-chartjs-2      | React wrapper for Chart.js       |

---

## 10. Success Metrics

| Metric                          | Target                                       |
|---------------------------------|----------------------------------------------|
| Daily attendance logging time   | < 2 minutes for 50 labourers                 |
| Payment dispute resolution      | Reduced by 90% (digital records as proof)    |
| Material cost visibility        | Real-time, within 1 click from dashboard     |
| System uptime                   | 99%+ availability                            |
| Data accuracy                   | Zero manual calculation errors (auto-compute)|

---

> **Document Version**: 1.0  
> **Created**: August 15, 2026  
> **Author**: CSMS Team  
> **Status**: Draft — Awaiting Approval
