# Construction Site Management System — Implementation Plan

Based on [prd.md](file:///Users/zeel/construction_site_management/prd.md)

---

## User Review Required

> [!IMPORTANT]
> This plan implements **Phase 1 (MVP)** of the PRD. Phase 2 (exports, Cloudinary, notifications) and Phase 3 (mobile, WhatsApp, GPS) are excluded. Confirm this scope is acceptable before proceeding.

> [!WARNING]
> **MongoDB is required locally.** Ensure MongoDB is installed and running on `mongodb://localhost:27017` before Step 2. Alternatively, provide a MongoDB Atlas connection string.

## Open Questions

> [!IMPORTANT]
> 1. **Site State for GST**: For CGST/SGST vs IGST determination, should we hardcode your company's state (e.g., Gujarat) or make it configurable per site?
> 2. **Bill Number Format**: The PRD suggests `BILL-2026-0001`. Should this be per-site (e.g., `SITE1-BILL-0001`) or global?
> 3. **Default Admin**: Should the first registered user automatically become an Admin, or should role assignment require an existing Admin?

---

## Proposed Changes

Implementation is divided into **8 sequential steps**. Each step builds on the previous one. Backend is built first (Steps 1–5), then Frontend (Steps 6–8).

---

### Step 1 — Project Scaffolding

Set up the monorepo structure with separate `server/` and `client/` directories, config files, and environment templates.

#### [NEW] [.gitignore](file:///Users/zeel/construction_site_management/.gitignore)
- Ignore `node_modules/`, `.env`, `dist/`, OS files

#### [NEW] [.env.example](file:///Users/zeel/construction_site_management/.env.example)
- Template with `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `VITE_API_URL`

#### [NEW] [README.md](file:///Users/zeel/construction_site_management/README.md)
- Project overview, setup instructions, available scripts

#### [NEW] server/package.json
- Initialize with `npm init` inside `server/`
- Install dependencies: `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `dotenv`, `cors`, `express-validator`, `multer`, `morgan`, `helmet`, `express-rate-limit`
- Dev dependency: `nodemon`
- Scripts: `"start": "node server.js"`, `"dev": "nodemon server.js"`

#### [NEW] client/ (Vite React App)
- Scaffold with `npx -y create-vite@latest ./` (React template) inside `client/`
- Install dependencies: `react-router-dom`, `axios`, `react-icons`, `react-toastify`, `react-datepicker`, `chart.js`, `react-chartjs-2`

---

### Step 2 — Backend Foundation

Core Express server setup, MongoDB connection, and shared middleware.

#### [NEW] [server/server.js](file:///Users/zeel/construction_site_management/server/server.js)
- Express app initialization
- Middleware: `cors`, `helmet`, `morgan`, `express.json()`, `express-rate-limit` (on `/api/auth`)
- Mount all route files under `/api/*`
- Centralized error handler (last middleware)
- MongoDB connection call → start server on `PORT`

#### [NEW] [server/config/db.js](file:///Users/zeel/construction_site_management/server/config/db.js)
- `connectDB()` function using `mongoose.connect(process.env.MONGO_URI)`
- Console log on success, `process.exit(1)` on failure

#### [NEW] [server/.env](file:///Users/zeel/construction_site_management/server/.env)
- Actual env values for local dev (not committed — covered by `.gitignore`)

#### [NEW] [server/middleware/errorHandler.js](file:///Users/zeel/construction_site_management/server/middleware/errorHandler.js)
- Centralized error middleware returning `{ success: false, error, statusCode }`
- Handle Mongoose `CastError`, `ValidationError`, duplicate key `11000`

#### [NEW] [server/middleware/auth.js](file:///Users/zeel/construction_site_management/server/middleware/auth.js)
- Extract JWT from `Authorization: Bearer <token>` header
- Verify with `jsonwebtoken`, attach `req.user`
- Return 401 if missing/invalid

#### [NEW] [server/middleware/roleCheck.js](file:///Users/zeel/construction_site_management/server/middleware/roleCheck.js)
- Factory function `authorize(...roles)` → checks `req.user.role` against allowed roles
- Return 403 if unauthorized

#### [NEW] [server/middleware/validate.js](file:///Users/zeel/construction_site_management/server/middleware/validate.js)
- Wrapper that runs `express-validator` validationResult and returns errors in standard format

#### [NEW] [server/utils/generateToken.js](file:///Users/zeel/construction_site_management/server/utils/generateToken.js)
- `generateToken(userId)` → `jwt.sign({ id: userId }, secret, { expiresIn })`

#### [NEW] [server/utils/calculateWage.js](file:///Users/zeel/construction_site_management/server/utils/calculateWage.js)
- `calculateWage(status, dailyWage, overtimeHours, overtimeRate)`
- Logic: present → full + overtime, half_day → half, absent → 0

#### [NEW] [server/utils/calculateGst.js](file:///Users/zeel/construction_site_management/server/utils/calculateGst.js)
- `calculateGst(items, isInterState, discountPercent)`
- Returns: `subtotal`, `discountAmount`, `taxableAmount`, `gstBreakup` (with rate-wise CGST/SGST/IGST), `grandTotal`

---

### Step 3 — Authentication Module

User model and auth endpoints.

#### [NEW] [server/models/User.js](file:///Users/zeel/construction_site_management/server/models/User.js)
- Mongoose schema per PRD `User` model
- Pre-save hook: hash password with bcrypt
- Instance method: `matchPassword(enteredPassword)`
- Index on `email` (unique)

#### [NEW] [server/controllers/authController.js](file:///Users/zeel/construction_site_management/server/controllers/authController.js)
- `register` — validate input, create user, return JWT + user data
- `login` — find by email, compare password, return JWT
- `getMe` — return `req.user` from auth middleware
- `changePassword` — verify old password, hash new, save

#### [NEW] [server/routes/authRoutes.js](file:///Users/zeel/construction_site_management/server/routes/authRoutes.js)
- `POST /register` → `register` (public)
- `POST /login` → `login` (public)
- `GET /me` → `getMe` (protected)
- `PUT /password` → `changePassword` (protected)

---

### Step 4 — Core Backend Modules

All CRUD models, controllers, and routes for the 6 core resources.

---

#### 4A — Site Management

#### [NEW] [server/models/Site.js](file:///Users/zeel/construction_site_management/server/models/Site.js)
- Schema per PRD: `name`, `location`, `description`, `clientName`, `clientPhone`, `startDate`, `expectedEndDate`, `status` (enum), `totalBudget`, `createdBy`
- Index on `createdBy`, `status`

#### [NEW] [server/controllers/siteController.js](file:///Users/zeel/construction_site_management/server/controllers/siteController.js)
- CRUD: `createSite`, `getSites` (with pagination), `getSiteById`, `updateSite`, `deleteSite`
- On delete: optionally cascade-delete related labours, materials, payments (or soft-delete)

#### [NEW] [server/routes/siteRoutes.js](file:///Users/zeel/construction_site_management/server/routes/siteRoutes.js)
- All 5 routes, `auth` middleware on all, `authorize('admin')` on POST/PUT/DELETE

---

#### 4B — Labour Management

#### [NEW] [server/models/Labour.js](file:///Users/zeel/construction_site_management/server/models/Labour.js)
- Schema per PRD: `name`, `phone`, `skill` (enum), `dailyWage`, `overtimeRate`, `address`, `aadharNumber`, `photo`, `siteId`, `isActive`
- Index on `siteId`, compound index `{ siteId, phone }` (unique within site)

#### [NEW] [server/controllers/labourController.js](file:///Users/zeel/construction_site_management/server/controllers/labourController.js)
- `addLabour`, `getLabours` (filter by skill, active status; paginate), `getLabourById`, `updateLabour`, `deleteLabour`
- `getLabourSummary` — aggregate attendance + payments to compute total earned, total paid, balance

#### [NEW] [server/routes/labourRoutes.js](file:///Users/zeel/construction_site_management/server/routes/labourRoutes.js)
- Nested under `/api/sites/:siteId/labours`
- Merge params from parent router

---

#### 4C — Attendance Management

#### [NEW] [server/models/Attendance.js](file:///Users/zeel/construction_site_management/server/models/Attendance.js)
- Schema per PRD: `labourId`, `siteId`, `date`, `status` (enum), `overtimeHours`, `workDescription`, `wageForDay`, `markedBy`
- Pre-save hook: auto-calculate `wageForDay` using `calculateWage` utility
- Compound unique index: `{ labourId, siteId, date }` — prevent duplicate attendance

#### [NEW] [server/controllers/attendanceController.js](file:///Users/zeel/construction_site_management/server/controllers/attendanceController.js)
- `markAttendance` — bulk create/upsert attendance records for multiple labourers on a given date
- `getAttendance` — filter by `date`, `labourId`, date range; paginate
- `updateAttendance` — update single record, recalculate `wageForDay`

#### [NEW] [server/routes/attendanceRoutes.js](file:///Users/zeel/construction_site_management/server/routes/attendanceRoutes.js)
- Nested under `/api/sites/:siteId/attendance`

---

#### 4D — Material Management

#### [NEW] [server/models/Material.js](file:///Users/zeel/construction_site_management/server/models/Material.js)
- Schema per PRD (updated with GST fields): includes `hsnCode`, `gstRate`, `billId`
- Pre-save hook: auto-calculate `totalAmount = quantity × ratePerUnit`
- Index on `siteId`, `category`, `receivedDate`

#### [NEW] [server/controllers/materialController.js](file:///Users/zeel/construction_site_management/server/controllers/materialController.js)
- CRUD + `getMaterialSummary` (aggregate by category for stock overview)
- Filter by `category`, `supplierId`, date range

#### [NEW] [server/routes/materialRoutes.js](file:///Users/zeel/construction_site_management/server/routes/materialRoutes.js)
- Nested under `/api/sites/:siteId/materials`

---

#### 4E — Material Bill Management (GST)

#### [NEW] [server/models/MaterialBill.js](file:///Users/zeel/construction_site_management/server/models/MaterialBill.js)
- Schema per PRD `MaterialBill` model
- `billNumber` auto-generation in pre-save hook (format: `BILL-YYYY-XXXX`)
- `gstBreakup` as nested subdocument with `rateWiseBreakup` array
- Pre-save hook: call `calculateGst` utility to compute all tax fields
- Virtual field: `balanceAmount = finalAmount - paidAmount`
- Index on `siteId`, `supplierId`, `billDate`, `status`

#### [NEW] [server/controllers/materialBillController.js](file:///Users/zeel/construction_site_management/server/controllers/materialBillController.js)
- `createBill` — accept items array, supplier info, isInterState flag; compute GST; save
- `getBills` — filter by supplier, status, date range; paginate
- `getBillById` — populate supplier details + linked materials
- `updateBill` — recalculate GST on item changes
- `deleteBill` — only if status is `draft`
- `updateBillStatus` — PATCH endpoint for status transitions + paidAmount update
- `getGstSummary` — aggregate CGST/SGST/IGST totals across all bills for a site, filterable by date range

#### [NEW] [server/routes/materialBillRoutes.js](file:///Users/zeel/construction_site_management/server/routes/materialBillRoutes.js)
- Nested under `/api/sites/:siteId/material-bills`
- 7 routes as per PRD

---

#### 4F — Supplier Management

#### [NEW] [server/models/Supplier.js](file:///Users/zeel/construction_site_management/server/models/Supplier.js)
- Schema per PRD (updated): includes `city`, `state`, `pincode`, `gstin`, `isGstRegistered`, `panNumber`, `bankDetails` (nested), `totalBilled`, `totalPaid`, `balanceDue`
- Index on `gstin` (sparse unique), `state`
- GSTIN format validation (15-char alphanumeric regex)

#### [NEW] [server/controllers/supplierController.js](file:///Users/zeel/construction_site_management/server/controllers/supplierController.js)
- CRUD with search by name, filter by `state`, `isGstRegistered`
- Auto-compute `totalBilled`, `totalPaid`, `balanceDue` via aggregation when fetching

#### [NEW] [server/routes/supplierRoutes.js](file:///Users/zeel/construction_site_management/server/routes/supplierRoutes.js)
- Mounted at `/api/suppliers` (not site-scoped — suppliers can serve multiple sites)

---

#### 4G — Payment Management

#### [NEW] [server/models/Payment.js](file:///Users/zeel/construction_site_management/server/models/Payment.js)
- Schema per PRD: `type` (labour/material), `referenceId`, `referenceName`, `siteId`, `amount`, `paymentDate`, `paymentMode` (enum), `transactionId`, `receiptImage`, `notes`, `paidBy`
- Post-save hook: if `type === 'material'`, update linked `MaterialBill.paidAmount` and recalculate `balanceAmount` + `status`
- Index on `siteId`, `type`, `referenceId`, `paymentDate`

#### [NEW] [server/controllers/paymentController.js](file:///Users/zeel/construction_site_management/server/controllers/paymentController.js)
- `recordPayment`, `getPayments` (filter by type, mode, date range), `getPaymentById`, `updatePayment`, `deletePayment`
- `getPaymentSummary` — aggregate total paid vs total outstanding for labours and suppliers

#### [NEW] [server/routes/paymentRoutes.js](file:///Users/zeel/construction_site_management/server/routes/paymentRoutes.js)
- Nested under `/api/sites/:siteId/payments`

---

### Step 5 — Dashboard & Reports Backend

#### [NEW] [server/controllers/dashboardController.js](file:///Users/zeel/construction_site_management/server/controllers/dashboardController.js)
- `getDashboard` — MongoDB aggregation pipeline returning:
  - Active labourers count
  - Today's attendance breakdown (present/absent/half_day)
  - Total labour cost to date
  - Total material cost to date
  - Total payments made (labour + material)
  - Total outstanding
  - Budget utilization %
- `getAttendanceReport` — group by date/labourer with filters
- `getLabourCostReport` — monthly breakdown of wage expenses
- `getMaterialCostReport` — category-wise material spend
- `getGstSummaryReport` — aggregate GST collected: rate-wise CGST/SGST/IGST totals
- `getPaymentLedger` — chronological payment log with running balance

#### [NEW] [server/routes/dashboardRoutes.js](file:///Users/zeel/construction_site_management/server/routes/dashboardRoutes.js)
- 6 GET routes under `/api/sites/:siteId/dashboard` and `/api/sites/:siteId/reports/*`

---

### Step 6 — Frontend Foundation

Set up the React app's design system, layout, routing, and shared services.

#### [MODIFY] [client/index.html](file:///Users/zeel/construction_site_management/client/index.html)
- Add meta tags (title, description, viewport)
- Link Google Font (Inter)

#### [NEW] [client/src/index.css](file:///Users/zeel/construction_site_management/client/src/index.css)
- CSS custom properties: color palette (dark theme with amber/orange accents for construction vibe), spacing scale, typography, border-radius, shadows
- Global reset, body defaults, scrollbar styling
- Utility classes: `.container`, `.grid`, `.card`, `.badge`, `.btn`, `.btn-primary`, `.btn-danger`, `.form-group`, `.table`

#### [MODIFY] [client/src/App.jsx](file:///Users/zeel/construction_site_management/client/src/App.jsx)
- Wrap app in `AuthProvider` and `BrowserRouter`
- Define routes with `react-router-dom`:
  - `/login`, `/register` (public)
  - `/` → Dashboard (protected)
  - `/sites` → Sites list, `/sites/:id` → Site detail
  - `/sites/:siteId/labours`, `/sites/:siteId/labours/:id`
  - `/sites/:siteId/attendance`
  - `/sites/:siteId/materials`
  - `/sites/:siteId/material-bills`, `/sites/:siteId/material-bills/:id`
  - `/sites/:siteId/suppliers`
  - `/sites/:siteId/payments`
  - `/sites/:siteId/reports`
- `ProtectedRoute` wrapper component redirecting unauthenticated users to `/login`

#### [NEW] [client/src/context/AuthContext.jsx](file:///Users/zeel/construction_site_management/client/src/context/AuthContext.jsx)
- React Context for auth state: `user`, `token`, `isAuthenticated`, `loading`
- `login()`, `register()`, `logout()` actions
- Persist token in `localStorage`, auto-load user on mount via `/api/auth/me`

#### [NEW] [client/src/services/api.js](file:///Users/zeel/construction_site_management/client/src/services/api.js)
- Axios instance with `baseURL = VITE_API_URL`
- Request interceptor: attach `Authorization: Bearer <token>` header
- Response interceptor: handle 401 → logout, show toast on errors

#### [NEW] [client/src/hooks/useAuth.js](file:///Users/zeel/construction_site_management/client/src/hooks/useAuth.js)
- Custom hook wrapping `useContext(AuthContext)`

#### [NEW] [client/src/hooks/useFetch.js](file:///Users/zeel/construction_site_management/client/src/hooks/useFetch.js)
- Generic data-fetching hook: `{ data, loading, error, refetch }`

#### [NEW] [client/src/components/layout/Navbar.jsx](file:///Users/zeel/construction_site_management/client/src/components/layout/Navbar.jsx)
- App logo/name, navigation links, user avatar dropdown with logout
- Responsive hamburger menu on mobile

#### [NEW] [client/src/components/layout/Sidebar.jsx](file:///Users/zeel/construction_site_management/client/src/components/layout/Sidebar.jsx)
- Side navigation: Dashboard, Sites, Suppliers (global), with active site submenu (Labours, Attendance, Materials, Bills, Payments, Reports)
- Collapsible on mobile

#### [NEW] [client/src/components/layout/Layout.jsx](file:///Users/zeel/construction_site_management/client/src/components/layout/Layout.jsx)
- Wrapper combining Navbar + Sidebar + main content area + `<Outlet />`

#### [NEW] [client/src/components/common/](file:///Users/zeel/construction_site_management/client/src/components/common/)
- `Button.jsx` — styled button with variants (primary, secondary, danger, ghost), sizes, loading state
- `Input.jsx` — form input with label, error message, icon support
- `Modal.jsx` — overlay modal with header, body, footer, close button
- `Table.jsx` — responsive data table with sorting headers, empty state
- `Card.jsx` — summary card with icon, title, value, trend indicator
- `Badge.jsx` — status badge (active/paid/pending) with color variants
- `Pagination.jsx` — page navigation with prev/next, page numbers
- `LoadingSpinner.jsx` — animated loading indicator
- `ConfirmDialog.jsx` — confirmation popup for delete actions

---

### Step 7 — Frontend Pages

Build all 14 page components with full UI.

#### [NEW] [client/src/pages/Login.jsx](file:///Users/zeel/construction_site_management/client/src/pages/Login.jsx)
- Centered card with email + password inputs, login button, register link
- Construction-themed hero illustration or gradient background

#### [NEW] [client/src/pages/Register.jsx](file:///Users/zeel/construction_site_management/client/src/pages/Register.jsx)
- Registration form: name, email, phone, password, confirm password, role dropdown

#### [NEW] [client/src/pages/Dashboard.jsx](file:///Users/zeel/construction_site_management/client/src/pages/Dashboard.jsx)
- Site selector dropdown at top
- Summary cards row: Active Labourers, Today's Attendance, Labour Cost, Material Cost, Payments Made, Outstanding
- Charts: Attendance trend (line), Cost breakdown (doughnut), Monthly spend (bar)
- Quick action buttons: Mark Attendance, Add Material, Record Payment

#### [NEW] [client/src/pages/Sites.jsx](file:///Users/zeel/construction_site_management/client/src/pages/Sites.jsx)
- Card grid of all sites with status badges, location, dates
- Search bar + status filter
- "Add Site" button → opens modal with site form

#### [NEW] [client/src/pages/SiteDetail.jsx](file:///Users/zeel/construction_site_management/client/src/pages/SiteDetail.jsx)
- Site header with name, location, status badge, edit button
- Tab navigation: Overview, Labours, Materials, Bills, Payments, Reports

#### [NEW] [client/src/pages/Labours.jsx](file:///Users/zeel/construction_site_management/client/src/pages/Labours.jsx)
- Table of labourers with skill badges, daily wage, active status
- Search + skill filter
- Add/Edit modal with form
- Click row → Labour Detail

#### [NEW] [client/src/pages/LabourDetail.jsx](file:///Users/zeel/construction_site_management/client/src/pages/LabourDetail.jsx)
- Profile card: name, phone, skill, wage, photo
- Attendance history table with date range filter
- Wage summary: total earned, total paid, balance
- Payment history list

#### [NEW] [client/src/pages/Attendance.jsx](file:///Users/zeel/construction_site_management/client/src/pages/Attendance.jsx)
- Date picker at top (defaults to today)
- Grid/table of all labourers with radio buttons: Present / Absent / Half Day
- Overtime hours input field per labourer
- Work description textarea
- Bulk save button

#### [NEW] [client/src/pages/Materials.jsx](file:///Users/zeel/construction_site_management/client/src/pages/Materials.jsx)
- Table of material entries: name, category, quantity, unit, rate, total, supplier, date
- Filters: category dropdown, supplier dropdown, date range
- Add material entry modal

#### [NEW] [client/src/pages/MaterialBills.jsx](file:///Users/zeel/construction_site_management/client/src/pages/MaterialBills.jsx)
- Table of bills: bill number, supplier, date, subtotal, GST, grand total, status badge
- Filters: supplier, status, date range
- "Create Bill" button → opens bill creation form
- Bill creation form:
  - Supplier selector (auto-fills GSTIN, state)
  - Inter-state toggle (auto-detect from supplier state vs site state)
  - Dynamic items table: add rows with material name, HSN, qty, unit, rate, GST rate
  - Live-calculated: subtotal, discount input, taxable amount, CGST/SGST or IGST, grand total
  - Save as Draft / Submit

#### [NEW] [client/src/pages/MaterialBillDetail.jsx](file:///Users/zeel/construction_site_management/client/src/pages/MaterialBillDetail.jsx)
- Bill header: bill number, date, supplier info, GSTIN, status
- Items table with HSN codes and per-item GST
- GST breakup section: rate-wise table showing taxable, CGST, SGST, IGST
- Totals: subtotal → discount → taxable → GST → grand total → round off → final
- Payment status: paid amount, balance, linked payments list
- Actions: Mark as Paid, Record Payment, Print/Download (Phase 2)

#### [NEW] [client/src/pages/Suppliers.jsx](file:///Users/zeel/construction_site_management/client/src/pages/Suppliers.jsx)
- Supplier cards/table: name, phone, GSTIN, state, GST registered badge
- Outstanding amount per supplier
- Add/Edit modal with full form (including bank details)

#### [NEW] [client/src/pages/Payments.jsx](file:///Users/zeel/construction_site_management/client/src/pages/Payments.jsx)
- Payment log table: date, type (labour/material), name, amount, mode, transaction ID
- Filters: type, payment mode, date range
- "Record Payment" modal:
  - Type selector (Labour / Material)
  - Dynamic reference selector (labourers list or suppliers list based on type)
  - Amount, date, mode, transaction ID, notes
  - Receipt image upload placeholder (shows file name, actual upload in Phase 2)

#### [NEW] [client/src/pages/Reports.jsx](file:///Users/zeel/construction_site_management/client/src/pages/Reports.jsx)
- Report type tabs: Attendance, Labour Cost, Material Cost, GST Summary, Payment Ledger
- Date range picker (shared across all tabs)
- Each tab renders appropriate table/chart
- GST Summary tab: rate-wise CGST/SGST/IGST totals, pie chart of tax distribution

---

### Step 8 — Integration, Polish & Verification

#### [MODIFY] [client/src/App.css](file:///Users/zeel/construction_site_management/client/src/App.css)
- App-level layout styles, page transition animations

#### [MODIFY] Multiple frontend pages
- Connect all pages to backend APIs via `api.js` service
- Add `react-toastify` success/error notifications on all CRUD operations
- Loading states with `LoadingSpinner` component
- Empty states with helpful messages

#### [MODIFY] [server/server.js](file:///Users/zeel/construction_site_management/server/server.js)
- Final route mounting verification
- CORS origin set to `http://localhost:5173` (Vite default)

#### [MODIFY] [client/vite.config.js](file:///Users/zeel/construction_site_management/client/vite.config.js)
- Add proxy config for `/api` → `http://localhost:5000` (avoids CORS in dev)

---

## Verification Plan

### Automated Tests

```bash
# 1. Backend — ensure server starts without errors
cd server && npm run dev
# Verify: "MongoDB Connected" + "Server running on port 5000" in console

# 2. API smoke tests with curl
# Auth
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Admin","email":"admin@test.com","phone":"9876543210","password":"admin123","role":"admin"}'

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
# Verify: JWT token returned

# Sites
curl -X POST http://localhost:5000/api/sites \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Site Alpha","location":"Mumbai","startDate":"2026-08-01"}'

# 3. Frontend — ensure it builds without errors
cd client && npm run build
# Verify: no build errors, dist/ folder created

# 4. Frontend — dev server runs
cd client && npm run dev
# Verify: opens on http://localhost:5173 without errors
```

### Manual Verification

| #  | Test Case                                             | Expected Result                                                |
|----|-------------------------------------------------------|----------------------------------------------------------------|
| 1  | Register a new Admin user                             | Success toast, redirected to Dashboard                         |
| 2  | Login with registered credentials                     | JWT stored, Dashboard loads with empty state                   |
| 3  | Create a new Site                                     | Site appears in Sites list with "Active" badge                 |
| 4  | Add 3 labourers to the site                           | Labourers appear in table with skill badges                    |
| 5  | Mark attendance for today (mix of present/absent/half) | Attendance saved, wage auto-calculated                         |
| 6  | Add a supplier with GSTIN                             | Supplier saved, GST registered badge shown                     |
| 7  | Add material entries                                  | Materials appear with correct total (qty × rate)               |
| 8  | Create a material bill with 3 items + GST             | GST breakup shows correct CGST/SGST or IGST amounts           |
| 9  | Record a payment against a labourer                   | Outstanding balance decreases                                  |
| 10 | Record a payment against a material bill              | Bill status changes, paidAmount updates                        |
| 11 | Dashboard shows correct summary numbers               | All cards match actual data                                    |
| 12 | GST summary report shows rate-wise breakup            | Totals match sum of individual bills                           |
| 13 | Responsive: test on 375px mobile width                | Sidebar collapses, tables scroll horizontally, forms stack     |
