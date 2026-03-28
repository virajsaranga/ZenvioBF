# Zenvio — Global Money Transfer Platform

Full-stack money transfer platform built with **React.js + Tailwind CSS** (frontend) and **Node.js + Express + MongoDB** (backend).

---

## 🚀 Features

### User Features
- ✅ Registration & Login with JWT (access + refresh tokens)
- ✅ Email verification & password reset
- ✅ KYC identity verification with document uploads
- ✅ Dashboard with real-time balance & stats
- ✅ Internal transfers between accounts
- ✅ Deposit requests with payment proof upload
- ✅ Withdrawal requests with bank details
- ✅ Full transaction history with filters & pagination
- ✅ Trust Points — earn on transfers, redeem for cash
- ✅ Partner / Referral program
- ✅ Profile & avatar management
- ✅ Real-time push notifications via Socket.IO

### Admin Features
- ✅ Dashboard with live stats & daily volume
- ✅ User management (activate / suspend)
- ✅ KYC document review & approval
- ✅ Deposit approval / rejection
- ✅ Withdrawal processing & refunds
- ✅ Full transaction monitoring

---

## 🛠️ Tech Stack

| Layer     | Technology                              |
|-----------|----------------------------------------|
| Frontend  | React 18, Tailwind CSS, Zustand, Axios |
| Backend   | Node.js, Express.js                    |
| Database  | MongoDB + Mongoose                     |
| Auth      | JWT (access + refresh tokens)          |
| Realtime  | Socket.IO                              |
| Email     | Nodemailer                             |
| Files     | Multer                                 |

---

## ⚡ Quick Start

### 1. Backend
```bash
cd backend
cp .env.example .env
# Edit .env — set MONGO_URI, JWT_SECRET, SMTP credentials
npm install
npm run seed    # Creates admin + test accounts
npm run dev     # http://localhost:5000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start       # http://localhost:3000
```

### 3. Docker (Full Stack)
```bash
# Edit backend/.env first
docker-compose up --build
```

---

## 🔑 Default Accounts (after seed)

| Role        | Email              | Password    |
|-------------|--------------------|-------------|
| Super Admin | admin@zenvio.io    | Admin@12345 |
| Test User   | user@zenvio.io     | User@12345  |
| KYC Pending | pending@zenvio.io  | User@12345  |

---

## 📁 Project Structure

```
zenvio/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/auth/
    │   ├── pages/dashboard/
    │   ├── pages/admin/
    │   ├── components/layout/
    │   ├── services/api.js
    │   └── context/authStore.js
    └── package.json
```

---

## 🔌 API Reference

### Auth — `/api/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | /register | Register |
| POST | /login | Login |
| POST | /refresh | Refresh token |
| GET  | /verify-email/:token | Verify email |
| POST | /forgot-password | Forgot password |
| POST | /reset-password/:token | Reset password |
| GET  | /me | Get current user |

### Transactions — `/api/transactions`
| Method | Path | Description |
|--------|------|-------------|
| POST | /transfer | Send money |
| GET  | / | List all |
| GET  | /summary | Stats summary |

### Admin — `/api/admin`
| Method | Path | Description |
|--------|------|-------------|
| GET | /dashboard | Stats |
| GET | /users | User list |
| PUT | /users/:id/status | Activate/suspend |
| PUT | /kyc/:id/review | KYC decision |
| PUT | /deposits/:id/review | Approve/reject deposit |
| PUT | /withdrawals/:id/process | Process withdrawal |

---

## 🌟 Trust Points System
- 10 pts per transfer
- 20 pts on KYC approval
- 50 pts per referral signup
- 100 pts = $1.00 cash

---

## 🔒 Security
- JWT + refresh token rotation
- Rate limiting (auth endpoints: 10 req/15min)
- bcrypt password hashing (12 rounds)
- Helmet.js HTTP headers
- MongoDB atomic transactions for transfers
- Input validation (express-validator)
