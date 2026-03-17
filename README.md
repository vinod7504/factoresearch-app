# Factoresearch App (React Native + Node + MongoDB)

This project includes:
- `backend`: Express API with MongoDB authentication, OTP password recovery via email, and Yahoo Finance market data.
- `mobile`: React Native (Expo) app with login/register, animated startup splash, full stock detail interface with chart, watchlist, suggestions, calculators, account, contact, and about screens.

## Features
- Register: username, email, phone, password
- Login: email, password
- Account details screen
- Animated startup logo splash screen
- Forgot password with OTP flow
- Welcome dashboard: stock details, top gainers, top losers (Yahoo Finance free data)
- Stock search + tap any stock for full details page
- Rich stock details UI: chart ranges, fundamentals/performance cards, buy-via-broker launch buttons
- User-specific watchlist (add/remove symbols)
- Our suggestions module (manually entered by admin)
- Admin panel (create/update/delete stock suggestions)
- EMI calculator
- Mutual fund SIP calculator
- Contact Us page
- About Us page

## 1) Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5001` by default.

### Backend environment
File: `backend/.env`
- `MONGODB_URI` is already set using your provided cluster string.
- Admin bootstrap credentials (auto-created at server startup if missing):
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`
  - `ADMIN_NAME`
  - `ADMIN_PHONE`
- Add SMTP credentials to send real OTP emails:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`

If SMTP is not configured, OTP is printed in backend logs for testing.

## 2) Mobile Setup

```bash
cd mobile
npm install
npm run start
```

### Mobile environment
File: `mobile/.env`
- `EXPO_PUBLIC_API_URL=http://localhost:5001/api`

If you run on a physical device, replace `localhost` with your computer's local IP.

## API Endpoints

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-otp`
- `POST /api/auth/reset-password`
- `GET /api/auth/me` (Bearer token)

Market:
- `GET /api/market/dashboard` (Bearer token)
- `GET /api/market/watchlist` (Bearer token)
- `POST /api/market/watchlist` (Bearer token)
- `DELETE /api/market/watchlist/:symbol` (Bearer token)
- `GET /api/market/quote/:symbol` (Bearer token)
- `GET /api/market/chart/:symbol?range=1d&interval=5m` (Bearer token)

Suggestions:
- `GET /api/suggestions` (Bearer token)

Admin:
- `GET /api/admin/suggestions` (Bearer token, admin)
- `POST /api/admin/suggestions` (Bearer token, admin)
- `PATCH /api/admin/suggestions/:id` (Bearer token, admin)
- `DELETE /api/admin/suggestions/:id` (Bearer token, admin)

## Security Note
The account screen displays a masked password (`********`) intentionally. Plain passwords are never stored or returned.
