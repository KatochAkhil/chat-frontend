# Nexus AI Chat Frontend (Next.js)

This folder contains the Next.js Single Page App (SPA) frontend for **Nexus AI Chat**. It handles user logins, real-time message rendering, socket presence/typing displays, and the Razorpay payment checkout process.

---

## 💳 Razorpay Test Payment Card Info
Use the following credentials in the Razorpay Checkout Modal to simulate a successful premium upgrade:

| Field | Value |
| :--- | :--- |
| **Card Number** | `4111 1111 1111 1111` |
| **Expiry Date** | Any future month/year (e.g., `12/30`) |
| **CVV** | `123` |
| **Cardholder Name** | `Test User` |

---

## ⚙️ Environment Configuration (`.env.local`)
Create a `.env.local` file inside this directory:

```env
# Backend API base URL
NEXT_PUBLIC_API_URL=http://localhost:4000/api

# Backend Socket.IO URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# Google OAuth Client ID (must match backend configuration)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here

# Razorpay Key ID (must match backend configuration)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

---

## 🛠️ Installation & Setup

1. Make sure Node.js `20.x` is active.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Access the web app at [http://localhost:3000](http://localhost:3000).

---

## ⚡ Development Operations

#### Run Type Checks
Verify compile-time type safety:
```bash
npm run type-check
```

#### Run Production Builds
Compile code for production deployment:
```bash
npm run build
```
