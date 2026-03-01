# OJ Gnan - Indian Tax Filing Assistant

A full-stack web application for Indian income tax filing assistance. Upload your **Form 16** PDF or enter details manually to get instant tax calculations, Old vs New regime comparison, and personalized tax-saving recommendations.

---

## ✨ Features

- 📄 **Form 16 PDF Upload** — Drag & drop or browse to upload Form 16; auto-extracts salary and TDS data
- 🧮 **Tax Calculation** — Computes tax under both Old and New regimes (FY 2024-25 / AY 2025-26)
- 📊 **Tax Summary Dashboard** — Visual charts comparing Old vs New regime, income breakdown, deductions
- 💡 **Smart Recommendations** — 12+ personalized tax-saving tips (80C, 80D, NPS, HRA, LTA, 87A rebate)
- 📉 **Deductions Analyzer** — Section-wise deduction utilization with optimization suggestions
- ✍️ **Manual Entry** — Enter salary details manually with **auto-fill** using standard Indian salary structure
- 📋 **Tax Slabs** — FY-wise tax slab reference (FY 2022-23 through FY 2025-26) with Old & New regime comparison

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, Tailwind CSS v3, Recharts, react-dropzone |
| Backend | Node.js, Express.js |
| PDF Parsing | pdf-parse |
| Icons | lucide-react |
| Notifications | react-hot-toast |

---

## 📁 Project Structure

```
oj-finance-tax/
├── frontend/                  # React.js application
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── Form16Upload.jsx      # PDF upload with drag & drop
│       │   ├── TaxSummary.jsx        # Dashboard with charts
│       │   ├── Recommendations.jsx   # Tax-saving recommendations
│       │   ├── DeductionsAnalyzer.jsx# Section-wise deduction analysis
│       │   ├── ManualEntry.jsx       # Manual salary entry with auto-fill
│       │   └── TaxSlabs.jsx          # FY-wise tax slab reference
│       ├── services/
│       │   └── taxApi.js             # API service layer
│       ├── utils/
│       │   └── formatters.js         # Currency & number formatters
│       └── App.js                    # Main app with navigation
│
├── backend/                   # Node.js + Express API
│   └── src/
│       ├── routes/
│       │   └── taxRoutes.js          # API route definitions
│       ├── utils/
│       │   ├── pdfParser.js          # Form 16 PDF text extraction
│       │   ├── taxCalculator.js      # Tax engine (Old & New regime)
│       │   └── recommendationEngine.js # Tax-saving recommendations
│       └── server.js                 # Express server entry point
│
├── .gitignore
├── package.json               # Root scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16
- npm >= 8

### 1. Clone the repository
```bash
git clone https://github.com/sandeeplati/oj-finance-tax.git
cd oj-finance-tax
```

### 2. Set up environment variables

**Backend:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env if needed (default port: 5001)
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
# Edit frontend/.env if backend runs on a different port
```

### 3. Install dependencies
```bash
# Install all dependencies (root + frontend + backend)
npm run install:all
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Run the application

**Start both frontend and backend:**
```bash
npm run dev
```

Or separately:
```bash
# Terminal 1 — Backend (port 5001)
cd backend && npm start

# Terminal 2 — Frontend (port 3000)
cd frontend && npm start
```

### 5. Open in browser
```
http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/tax/upload` | Upload Form 16 PDF |
| `POST` | `/api/tax/calculate` | Calculate tax (Old & New regime) |
| `GET` | `/api/tax/slabs` | Get current tax slabs |
| `GET` | `/api/tax/deductions` | Get deduction sections info |

---

## 🧾 Tax Calculation Logic

### Old Regime Slabs (FY 2024-25)
| Income Range | Tax Rate |
|-------------|---------|
| Up to ₹2,50,000 | Nil |
| ₹2,50,001 – ₹5,00,000 | 5% |
| ₹5,00,001 – ₹10,00,000 | 20% |
| Above ₹10,00,000 | 30% |

### New Regime Slabs (FY 2024-25)
| Income Range | Tax Rate |
|-------------|---------|
| Up to ₹3,00,000 | Nil |
| ₹3,00,001 – ₹7,00,000 | 5% |
| ₹7,00,001 – ₹10,00,000 | 10% |
| ₹10,00,001 – ₹12,00,000 | 15% |
| ₹12,00,001 – ₹15,00,000 | 20% |
| Above ₹15,00,000 | 30% |

- **Section 87A Rebate**: Up to ₹12,500 (Old) / ₹25,000 (New) for eligible taxpayers
- **Standard Deduction**: ₹50,000 (Old) / ₹75,000 (New)
- **Health & Education Cess**: 4% on tax + surcharge

---

## 📜 License

MIT License — © 2024 OJ Gnan