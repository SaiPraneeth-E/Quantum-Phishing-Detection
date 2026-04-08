# Quantum Phishing Detection

A full-stack **Quantum-Enhanced Real-Time Phishing Detection System** with:

- Cyber-themed React frontend
- Node.js + Express API gateway/backend
- Python FastAPI ML service
- MongoDB persistence
- JWT auth with User/Admin/Root-Admin controls

---

## Features

### Core Security Features
- Real-time single URL phishing prediction
- **Bulk URL scan** (paste multiple URLs, up to 50)
- Confidence score and risk factors
- Prediction history (search, filter, export CSV, delete items)

### User Features
- Register/Login
- Dashboard with personal metrics
- Weekly trend chart (total/phishing/legitimate)
- Profile settings (update name, change password)

### Admin Features
- Admin panel for users and prediction insights
- Analytics dashboard with charts
- Root-admin controls to promote/remove admins
- Protected root admin account that cannot be demoted

### Contact
- Footer Connect form sends messages to configured email (via Nodemailer + Gmail app password)

---

## Tech Stack

### Frontend
- React + Vite
- TailwindCSS
- Recharts
- Axios

### Backend
- Node.js
- Express
- Mongoose (MongoDB)
- JWT (`jsonwebtoken`)
- `bcryptjs`
- `express-rate-limit`
- Nodemailer

### ML Service
- FastAPI
- scikit-learn
- NumPy
- Qiskit (optional pipeline components)

---

## Project Structure

```text
phishing-detection-system/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── ml_service/
│   │   ├── predict.py
│   │   ├── features.py
│   │   ├── requirements.txt
│   │   └── *.pkl (your model files)
│   ├── utils/
│   │   └── bootstrapRootAdmin.js
│   ├── server.js
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   └── ...
└── README.md
```

---

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ML_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

CONTACT_EMAIL=saipraneeth080805@gmail.com
GMAIL_USER=saipraneeth080805@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

ROOT_ADMIN_EMAIL=saipraneeth080805@gmail.com
ROOT_ADMIN_PASSWORD=Praneeth7816
ROOT_ADMIN_NAME=Edupulapati Sai Praneeth
```

> Important: change `JWT_SECRET`, `ROOT_ADMIN_PASSWORD`, and email credentials in production.

---

## Local Setup

## 1) Backend

```bash
cd backend
npm install
npm run dev
```

Runs at: `http://localhost:5000`

---

## 2) ML Service (FastAPI)

```bash
cd backend/ml_service
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn predict:app --host 0.0.0.0 --port 8000
```

Runs at: `http://localhost:8000`

Place trained model files in `backend/ml_service/` if available:
- `phishing_model.pkl`
- `quantum_model.pkl`
- `scaler.pkl`
- `quantum_scaler.pkl`

---

## 3) Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs at: `http://localhost:3000`

---

## Auth & Roles

- **User**: default role on registration
- **Admin**: elevated role
- **Root Admin**: defined by `ROOT_ADMIN_EMAIL`; can manage admin assignments and cannot be removed/demoted

Admin login route: `/admin/login`

---

## API Summary

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `PATCH /api/auth/password`

### Prediction
- `POST /api/predict` (single URL)
- `POST /api/predict/bulk`
- `GET /api/predict/history`
- `DELETE /api/predict/history/:id`
- `GET /api/predict/stats`

### Admin
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/predictions`
- `GET /api/admin/analytics`

### Root Admin Only
- `GET /api/admin/admins`
- `POST /api/admin/admins` (promote by email)
- `DELETE /api/admin/admins/:id`

### Contact
- `POST /api/contact`

### ML Service
- `POST /predict`
- `GET /health`

---

## Windows Notes

If PowerShell blocks npm scripts:

```powershell
npm.cmd install
npm.cmd run dev
```

---

## Security Notes

- Do **not** commit real `.env` secrets to public repositories.
- Use strong passwords and rotate credentials regularly.
- Use HTTPS and proper CORS for production deployments.
- Restrict root admin credentials to trusted environments only.

---

## Deployment (Suggested)

- Frontend: Vercel / Netlify
- Backend: Railway / Render / AWS
- ML Service: Render / Railway / Docker
- DB: MongoDB Atlas

Set production environment variables for each service accordingly.

