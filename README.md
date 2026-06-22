# Diamond Management System

A full-stack diamond inventory and trading management platform built with **React + Vite** (frontend) and **Node.js + Express + MongoDB** (backend). It tracks the complete lifecycle of a diamond — from purchase through pricing, inventory, sale, and P&L reporting — with multi-currency support (USD, INR, RUB) and bulk Excel import/export.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [Backend API](#backend-api)
- [Frontend Pages & Components](#frontend-pages--components)
- [Business Logic & Calculations](#business-logic--calculations)
- [Excel Import / Export](#excel-import--export)
- [Getting Started](#getting-started)

---

## Overview

This application is designed to manage purchasing, pricing, inventory, and sales across multiple currencies (primarily USD, INR, and RUB). Every diamond starts as a **Transaction** — a single flat document containing all relevant data — which is simultaneously mirrored into five normalised sub-documents (Diamond, Purchase, Pricing, Sale, PL) for structured querying.

---

## Features

### Core Functionality
- **Transaction Management** — Create, read, update, and delete diamond transactions with 50+ data fields spanning diamond specs, purchase details, pricing, inventory, sale, and P&L.
- **Bulk Excel Import** — Parse `.xlsx` files, map columns to fields, resolve status/bank references, detect duplicates, and offer to skip, update, or import+update in one flow.
- **Duplicate Detection** — On import, the system compares incoming rows against existing SKUs and performs a field-level diff (excluding auto-computed fields) to identify truly changed records vs. identical ones.
- **Multi-Currency Pricing** — Auto-compute prices in INR, USD, and RUB using live exchange rates from configurable bank records.
- **P&L Dashboard** — Aggregates margin data by diamond type (Certified, Natural, Miele, Noncertified, Produced) with date-range and synthesis (CVD/HPHT) filtering, and a drilldown modal per type.
- **Masters Management** — CRUD UI for Banks (exchange rates), Statuses, Payment Statuses, and Diamond Types, each with active/inactive toggling and colour coding.
- **Export** — Export all or selected transactions to Excel (`.xlsx`) or PDF (landscape, auto-column-width, paginated) directly from the browser.
- **Advanced Filtering** — Slide-over filter panel with text search on SKU/shipping/supplier/courier, date range picker, and multi-select chips for status, payment status, shape, currency, laboratory, and warehouse.
- **Multi-Column Sorting** — Slide-over sort panel with drag-to-reorder priority, ascending/descending toggle, and inline column header click-to-sort.
- **Pagination** — Client-side pagination with configurable page size (25 / 50 / 100 / 250) and smart ellipsis page numbers.
- **Column Reordering** — Drag-and-drop table headers to reorder columns (persisted in component state for the session).
- **Row Selection** — Checkbox-based multi-select with page-level select-all; floating action bar for exporting selected rows.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite  |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing | React Router DOM v7 |
| Excel parsing/writing | SheetJS (xlsx) loaded from CDN |
| PDF generation | jsPDF + jspdf-autotable (lazy CDN load) |
| Backend framework | Express v5 |
| Database | MongoDB via Mongoose v9 |
| Dev server | Nodemon |

---

## Project Structure

```
├── backend/
│   ├── controllers/
│   │   ├── bankController.js          # CRUD + getActive
│   │   ├── contactController.js       # CRUD + getByType
│   │   ├── diamondController.js       # CRUD
│   │   ├── diamondTypeController.js   # CRUD + getActive
│   │   ├── inventoryController.js     # CRUD + getByStatus + updateStatus
│   │   ├── paymentStatusController.js # CRUD + getActive
│   │   ├── plController.js            # CRUD + getByManager; auto-calcs P&L
│   │   ├── pricingController.js       # CRUD; auto-calcs sell prices
│   │   ├── purchaseController.js      # CRUD; auto-calcs INR prices
│   │   ├── saleController.js          # CRUD; auto-calcs saleBaseINR
│   │   ├── statusController.js        # CRUD + getActive
│   │   └── transactionController.js   # Master controller; orchestrates all sub-docs
│   ├── middleware/
│   │   ├── errorHandler.js            # Global error handler (Validation, Cast, Duplicate key)
│   │   ├── notFound.js                # 404 catch-all
│   │   └── validate.js                # validateId + validateBody helpers
│   ├── models/
│   │   ├── Bank.js                    # name, usdToInr, usdToRub, inrToRub, isActive
│   │   ├── Contact.js                 # name, type (supplier/buyer/courier/manager), company, ...
│   │   ├── Diamond.js                 # skuNo (unique), physical specs, certificate
│   │   ├── Diamondtype.js             # label (unique), color, isActive
│   │   ├── Inventory.js               # refs Diamond+Purchase; status enum, warehouse, ...
│   │   ├── PL.js                      # refs Diamond+Purchase+Sale; margin, bonus fields
│   │   ├── PaymentStatus.js           # label (unique), color, isActive
│   │   ├── Pricing.js                 # refs Diamond+Purchase+Bank; markup, priceRUB, priceUSD, ...
│   │   ├── Purchase.js                # refs Diamond+Bank; all cost/rate/INR fields
│   │   ├── Sale.js                    # refs Diamond+Purchase+Bank; saleAmount, saleBaseINR
│   │   ├── Status.js                  # label (unique), color, isActive
│   │   └── Transaction.js             # Flat denormalised master doc (50+ fields)
│   ├── routes/
│   │   ├── bankRoutes.js
│   │   ├── contactRoutes.js
│   │   ├── diamondRoutes.js
│   │   ├── diamondTypeRoutes.js
│   │   ├── inventoryRoutes.js
│   │   ├── paymentStatusRoutes.js
│   │   ├── plRoutes.js
│   │   ├── pricingRoutes.js
│   │   ├── purchaseRoutes.js
│   │   ├── saleRoutes.js
│   │   ├── statusRoutes.js
│   │   └── transactionRoutes.js
│   ├── index.js                       # Express app entry point
│   ├── package.json
│
├── frontend/
│   ├── components/
│   │   ├── DuplicateChecker.jsx       # Modal for resolving import duplicates
│   │   ├── FilterButton.jsx           # Slide-over filter panel
│   │   ├── Pagination.jsx             # Page controls with size selector
│   │   └── SortButton.jsx             # Slide-over multi-column sort panel
│   ├── src/
│   │   ├── forms/
│   │   │   ├── CreateTransactionPage.jsx  # Tabbed form for new transaction
│   │   │   └── EditTransactionPage.jsx    # Tabbed form for editing existing transaction
│   │   ├── pages/
│   │   │   ├── Masters.jsx            # Banks / Status / Payment Status / Diamond Types tabs
│   │   │   ├── ProfitLoss.jsx         # P&L overview by diamond type
│   │   │   ├── ProfitLossDrilldown.jsx# Modal drilldown table per type
│   │   │   └── Sidebar.jsx            # Collapsible navigation sidebar
│   │   ├── App.jsx                    # Router + layout
│   │   ├── Banks.jsx                  # (Standalone banks card view — legacy/alternate)
│   │   ├── Sample.jsx                 # Main transactions table page
│   │   ├── App.css / index.css        # Tailwind imports
│   │   └── main.jsx                   # React entry point
│   ├── utils/
│   │   └── Exportutils.js             # exportExcel() and exportPDF() helpers
│   ├── public/
│   │   ├── _redirects                 # SPA fallback for Netlify/Render
│   │   └── favicon.svg
│   ├── .env.development               # VITE_API_URL=http://localhost:5000/api
│   ├── vite.config.js
│   └── package.json
```

---

## Data Models

### Bank
Stores exchange rates used for all currency conversions. All three rates are required.

| Field | Type | Description |
|---|---|---|
| `name` | String | Bank/exchange name |
| `usdToInr` | Number | USD → INR rate |
| `usdToRub` | Number | USD → RUB rate |
| `inrToRub` | Number | INR → RUB rate |
| `isActive` | Boolean | Whether to surface in dropdowns |

### Transaction (master flat document)
The central model. Contains 50+ fields covering all stages. When saved, the backend **automatically creates or syncs** five linked sub-documents.

Key field groups:

| Group | Key Fields |
|---|---|
| Diamond Identity | `skuNo` (unique), `shippingNo`, `shape`, `weight`, `carat`, `colour`, `clarity`, `cut`, `synthesis`, `certificateNo`, `laboratory` |
| Measurements | `length`, `width`, `height` (stored separately, concatenated as `measurement` in Diamond sub-doc) |
| Purchase & Cost | `pricePerCaratUSD`, `gstPercent`, `gstAmount`, `buyPriceTotal`, `rateAtPurchase`, `basePriceINR`, `correctionPriceUSD`, `actualRate`, `actualPriceINR`, `marketPL` |
| Pricing & Markup | `markup`, `sellPriceLocalCurrency`, `localCurrency`, `typeOfExchange`, `priceRUB`, `priceUSD`, `pricePerCt`, `rateRUB` |
| Inventory | `status` (→ Status ObjectId), `paymentStatus` (→ PaymentStatus ObjectId), `warehouse`, `inventoryDate`, `inventoryManager`, `location` |
| Sale | `dateOfSale`, `buyerName`, `saleAmount`, `saleCurrency`, `rateOnDateOfSale`, `saleBaseINR` |
| P&L | `marginality`, `actualMarkup`, `manager`, `bonusPoints`, `bonusAmount`, `bonusRate`, `bonusInLocalCurrency` |
| Relations | `bank` (→ Bank ObjectId), `diamondType` (→ DiamondType ObjectId) |

### Status / PaymentStatus / DiamondType
All share the same schema: `label` (unique string), `color` (hex string), `isActive`.

### Diamond
Extracted from Transaction on save: `skuNo`, `shippingNo`, physical specs, measurement string, certificate fields.

### Purchase
References Diamond + Bank. All cost, rate, and INR calculation fields.

### Pricing
References Diamond + Purchase + Bank. Markup and sell price fields.

### Sale
References Diamond + Purchase + Bank. Sale amount, currency, rate, base INR.

### PL (Profit & Loss)
References Diamond + Purchase + Sale. Margin, markup, bonus fields.

---

## Backend API

Base URL: `/api`

### Banks — `/api/banks`
| Method | Path | Description |
|---|---|---|
| GET | `/` | All banks |
| GET | `/active` | Active banks only |
| GET | `/:id` | Single bank |
| POST | `/` | Create bank |
| PUT | `/:id` | Update bank |
| DELETE | `/:id` | Delete bank |

### Transactions — `/api/transactions`
| Method | Path | Description |
|---|---|---|
| GET | `/` | All transactions (populated bank, status, paymentStatus, diamondType) |
| GET | `/:id` | Single transaction |
| POST | `/` | Create transaction + auto-create linked sub-docs |
| PUT | `/:id` | Update transaction + sync linked sub-docs |
| DELETE | `/:id` | Delete transaction + cascade-delete linked sub-docs |

**Transaction create/update flow:**
1. Resolve `status`, `paymentStatus`, `diamondType` — accepts ObjectId or string label.
2. Look up bank by ObjectId or fuzzy name match to extract `usdToInr`, `usdToRub`, `inrToRub`.
3. Compute all derived fields (`gstAmount`, `buyPriceTotal`, `basePriceINR`, `actualPriceINR`, `marketPL`, `priceRUB`, `priceUSD`, `saleBaseINR`, `marginality`, `bonusAmount`, etc.).
4. Save Transaction.
5. Create (or upsert by `skuNo`) Diamond → Purchase → Sale → Pricing → PL.

### Statuses — `/api/statuses`
| Method | Path | Description |
|---|---|---|
| GET | `/` | All statuses |
| GET | `/active` | Active only |
| POST | `/` | Create |
| PUT | `/:id` | Update |
| DELETE | `/:id` | Delete |

Same pattern applies to `/api/payment-statuses` and `/api/diamond-types`.

### Other Endpoints
- `/api/diamonds` — CRUD for Diamond sub-docs directly
- `/api/purchases` — CRUD for Purchase sub-docs
- `/api/pricing` — CRUD for Pricing sub-docs
- `/api/sales` — CRUD for Sale sub-docs
- `/api/pl` — CRUD for PL sub-docs (+ `GET /manager/:manager`)
- `/api/inventory` — CRUD for Inventory records (+ `GET /status/:status`, `PUT /:id` updates status)
- `/api/contacts` — CRUD for Contacts (+ `GET /type/:type`)

---

## Frontend Pages & Components

### `Sample.jsx` — Transactions Table
The main page. Renders a virtualized (paginated) data table with:
- **Sticky header row** with drag-to-reorder columns and click-to-sort.
- **Inline badge rendering** for Status, PaymentStatus, and DiamondType (colour from master data).
- **Special formatting** for currency values, dates, SKU numbers, Market P/L (green/red arrows).
- **PriceRUB column** — displays `ceil(sellPriceLocalCurrency / 100) * 100` (rounded up to nearest 100 RUB) rather than the raw stored value.
- Row click → navigates to Edit page; checkbox click → toggles selection.
- Empty state with drag-and-drop file upload zone.

### `CreateTransactionPage.jsx` / `EditTransactionPage.jsx`
Tabbed forms (General / Pricing / Sales / Bonus) with:
- Live preview of all auto-calculated fields as you type (no API call needed).
- Bank selector that auto-fills rate fields.
- Status, Payment Status, Diamond Type dropdowns populated from master APIs.
- Summary cards at the bottom showing Buy Total, Base INR, Market P/L, Price (RUB).

### `ProfitLoss.jsx` + `ProfitLossDrilldown.jsx`
- Top-level view aggregates all transactions by Diamond Type with total sell, base, and margin.
- Synthesis filter (All / CVD / HPHT) and date range filter in the header.
- Click any type card → opens `ProfitLossDrilldown` modal with sortable, date-filterable row-level table and footer totals.

### `Masters.jsx`
Four-tab page (Banks / Status / Payment Status / Diamond Types):
- Inline add/edit form at the top.
- Live table below with toggle-active and delete per row.
- Banks tab has three rate fields; others have label + colour picker + active toggle.

### `FilterButton.jsx`
Slide-over panel (400px, from right) with:
- Text inputs: SKU No., Shipping No.
- Dropdowns: Supplier, Courier (derived from real data).
- Date range picker.
- Payment direction buttons (Credit/Debit — wired to `direction` filter key, visual only — actual filtering by this field is not yet applied in `Sample.jsx`).
- Collapsible multi-select chip groups for Status, Payment Status, Shape, Currency, Laboratory, Warehouse.

### `SortButton.jsx`
Slide-over panel with:
- Active sort rules list (drag to reorder priority).
- Asc/Desc toggle per rule.
- Searchable column picker.
- Priority badge on header cells.

### `DuplicateChecker.jsx`
Modal that appears when an import finds existing SKUs:
- Shows counts: New to Import / Data Changed / No Change.
- Lists changed SKUs (blue) vs. identical SKUs (grey).
- Actions: Cancel, Import New Only, Update Changed Only, Update + Import New.
- Uses a field-level diff (ignoring all server-computed fields) to distinguish truly changed records.

### `Pagination.jsx`
Compact pagination bar with page buttons, prev/next, ellipsis, and a custom page-size dropdown (25/50/100/250).

---

## Business Logic & Calculations

All derived fields are calculated both on the backend (authoritative, stored) and on the frontend (live preview while editing). The formulas:

```
gstAmount            = weight × pricePerCaratUSD × (gstPercent / 100)
buyPriceTotal        = weight × pricePerCaratUSD          [+ gstAmount in backend purchase calc]
basePriceINR         = buyPriceTotal × usdToInr
actualPriceINR       = correctionPriceUSD × weight × actualRate
marketPL             = actualPriceINR - basePriceINR

sellPriceLocalCurrency = (actualPriceINR / inrToRub) × (1 + markup)
priceRUB             = ceil(sellPriceLocalCurrency / inrToRub / 100) × 100
priceUSD             = sellPriceLocalCurrency / usdToInr
pricePerCt           = priceUSD / weight

saleBaseINR          = saleAmount × rateOnDateOfSale
marginality          = saleBaseINR - basePriceINR
actualMarkup         = (saleBaseINR / basePriceINR × 100) - 100

bonusAmount          = (actualPriceINR / 100) × bonusPoints
bonusInLocalCurrency = bonusAmount / bonusRate (or inrToRub)
```
---

## Excel Import / Export

### Import
Expected column order (0-indexed):

| Index | Field |
|---|---|
| 0 | shippingNo |
| 1 | skuNo (required) |
| 2 | courier |
| 3 | supplier |
| 4 | buyerAtSource |
| 5 | dateOfPurchase |
| 6 | shape |
| 7 | weight |
| 8 | certificateNo |
| 9 | pricePerCaratUSD |
| 10 | gstPercent |
| 13 | purchaseCurrency |
| 16 | correctionPriceUSD |
| 17 | actualRate |
| 20 | markup |
| 22 | localCurrency |
| 23 | typeOfExchange (bank name, fuzzy-matched) |
| 24 | paymentStatus (label, fuzzy-matched) |
| 25 | status (label, fuzzy-matched) |
| 26 | warehouse |
| 27 | inventoryDate |
| 28 | inventoryManager |
| 30 | synthesis |
| 31 | diamondType |
| 32 | cut |
| 33 | carat |
| 34 | colour |
| 35 | clarity |
| 40 | location |
| 41 | laboratory |
| 43 | measurement (format: `L×W×H`) |
| 45 | dateOfSale |
| 46 | buyerName |
| 47 | saleAmount |
| 48 | saleCurrency |
| 49 | rateOnDateOfSale |
| 54 | manager |
| 55 | bonusPoints |
| 57 | bonusRate |


### Export
Both Excel and PDF exports use `EXPORT_COLUMNS` (56 columns), pulling values from the flat transaction object. Populated sub-documents (objects with `.label` or `.name`) are rendered as their label/name string. Dates are formatted as `DD Mon YYYY`.

- **Excel**: Uses SheetJS `aoa_to_sheet`, sets column widths, freezes the header row.
- **PDF**: Uses jsPDF + autotable in landscape mode. Page width expands dynamically to fit all columns without wrapping (≈ A1-wide). Includes a blue banner header with record count and export date, alternating row shading, and page number footers.

---

## Getting Started

### Backend Setup

```bash
cd backend
npm install
```

Start the server:
```bash
npm run dev      # nodemon (hot reload)
npm start        # plain node
```

### Frontend Setup

```bash
cd frontend
npm install
```

Start the dev server:
```bash
npm run dev
```


### Build for Production

```bash
cd frontend
npm run build    # outputs to frontend/dist/
```

---

## Deployment

The project is configured for deployment on **Render**:

- **Backend**: Web service running `npm start` from the `backend/` directory. 
- **Frontend**: Static site built from `frontend/` with `npm run build`. 

The CORS configuration in `backend/index.js` explicitly allows:
```
https://management-frontend-2pcq.onrender.com
http://localhost:5173
```


7. **Linked document cascade** — On transaction delete, `deleteLinkedDocuments` finds the Diamond by `skuNo` and deletes all linked PL, Pricing, Sale, Purchase, Diamond records. If the `skuNo` doesn't exist in the Diamond collection (e.g., if Diamond creation failed on import), deletion is silently skipped with a console warning.

8. **CDN dependencies at runtime** — SheetJS is loaded from `https://cdn.sheetjs.com` and jsPDF from `cdnjs.cloudflare.com`. These CDN calls happen at import/export time and will fail without internet access.
