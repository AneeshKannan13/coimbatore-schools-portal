# Coimbatore Corporation Government School Performance Management, AI Analytics & Power BI Integration Portal

Official education monitoring, student performance analysis, and institutional decision-support system built for **Coimbatore City Municipal Corporation**.

---

## 🏛️ Key Features & Capabilities

1. **Official Government Public Portal**:
   - Institutional branding, animated hero slideshow, live statistics (Schools, Students, Teachers, Attendance benchmark).
   - Public Corporation School Directory with zone/ward classification and enrollment indicators.

2. **Secure Role-Based Access Control (RBAC)**:
   - **Staff / Teacher**: Subject and class dashboards (9th, 10th, 11th, 12th), mark entry, attendance, and student intervention profiles.
   - **Headmaster (HM)**: School-wide KPIs, School Performance Index (SPI), class comparisons, and teacher compliance.
   - **Corporation Commissioner**: Executive command center, inter-school benchmarking, zone comparisons, and strategic AI alerts.
   - **System Administrator**: Master data configuration, audit logging, and Power BI connection controls.

3. **Standardized Excel Upload & Validation Engine**:
   - Matches the official **Students Mark Details**, **Students Attendance**, and **Teachers Attendance** structures.
   - High-throughput row validation with field boundaries (theory/practical bounds, EMIS checks, school isolation, duplicate checks).
   - Interactive preview screen showing valid vs invalid rows with error logs before database commit.
   - Normalized single source of truth storage in PostgreSQL/SQLite.

4. **AI & Statistical Analytics Engine**:
   - Automatic composite risk scoring (Academic 40%, Attendance 25%, Failed Subjects 20%, Trend 15%).
   - Early warning classification: *Excellent*, *Good*, *Average*, *Needs Attention*, *High Risk*.
   - Plain-English synthesized student insights and targeted interventions.
   - Institutional **School Performance Index (SPI)** calculation.

5. **Microsoft Power BI Integration**:
   - Dedicated reporting views:
     - `vw_student_performance`
     - `vw_school_performance`
     - `vw_subject_performance`
     - `vw_student_risk_analysis`
   - Real-time DirectQuery support and REST API connector endpoints.

---

## 🏗️ System Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, XLSX.
- **Backend**: Python 3.13 / FastAPI, SQLAlchemy ORM, Pydantic, Bcrypt, PyJWT.
- **Data & Analytics**: Pandas, NumPy, Scikit-learn, OpenPyXL.
- **Database**: PostgreSQL (Production) / SQLite (Local dev), Alembic migrations.
- **BI Layer**: Microsoft Power BI Desktop & Power BI Service with DirectQuery views.

---

## 🚀 Quick Start & Local Run Guide

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the backend FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Web portal will be live at: `http://localhost:5173`

---

## 🔐 Default Demo Accounts (Pre-Seeded)

| Role | Username | Password | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **Teacher / Staff** | `teacher_ravi` | `Admin@123` | Coimbatore Corp HSS, R.S. Puram (Class 10-A Maths) |
| **Headmaster (HM)** | `hm_rspuram` | `Admin@123` | Coimbatore Corp HSS, R.S. Puram (Full School) |
| **Commissioner** | `commissioner` | `Admin@123` | All 42 Corporation Schools (Executive Command) |
| **System Admin** | `admin` | `Admin@123` | Full Application & System Configuration |

*(You can also use the one-click demo role switcher directly on the Login Modal).*

---

## 📊 Running Automated Tests
```bash
python -m pytest tests/test_api.py -v
```

---

## 🐳 Docker Deployment
To launch the full stack (PostgreSQL, FastAPI Backend, React Web Nginx):
```bash
cd docker
docker-compose up --build
```
