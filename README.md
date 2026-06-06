# Nqwest — Full-Stack App

React (Vite) frontend + FastAPI Python backend with Google OAuth 2.0 login.

---

## Project Structure

```
nqwest/
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── WaveCanvas.jsx      # Animated background canvas
│   │   │   ├── SplashScreen.jsx    # 5-second splash (click or timeout)
│   │   │   └── LoginPanel.jsx      # Google Sign-In card
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Splash → Login orchestrator
│   │   │   └── Dashboard.jsx       # Post-login view (/index.html)
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── backend/                # Python FastAPI
    ├── main.py             # Google token verification endpoint
    ├── requirements.txt
    └── .env.example        # Copy to .env and fill in your Client ID
```

---

## 1. Google Cloud Setup (Required)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorised JavaScript origins:
   - `http://localhost:3000`
6. Authorised redirect URIs:
   - `http://localhost:3000`
7. Copy the **Client ID** (looks like `123456.apps.googleusercontent.com`)

---

## 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env → paste your GOOGLE_CLIENT_ID

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload --port 8000
```

Backend will be live at **http://localhost:8000**  
API docs: **http://localhost:8000/docs**

---

## 3. Frontend Setup

```bash
cd frontend
npm install

# Add your Google Client ID to a .env file:
echo "VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com" > .env

npm run dev
```

App will be live at **http://localhost:3000**

> The Vite dev server proxies `/auth/*` to FastAPI, so no CORS issues during development.

---

## 4. Wire up the Google Client ID in React

Open `frontend/src/index.jsx` and replace the placeholder:

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);
```

---

## 5. Flow

```
Browser loads http://localhost:3000
  │
  ▼
SplashScreen ("Welcome to Nqwest")
  │  dismisses after 5 seconds OR on any click
  ▼
LoginPanel ("Please login with Google")
  │  user clicks Google button → Google popup
  │  Google returns ID token to browser
  │  browser POSTs token to http://localhost:8000/auth/google
  │  FastAPI verifies token with Google's public keys
  │  returns { user: { name, email, picture, ... } }
  ▼
Dashboard (URL becomes /index.html)
```

---

## API Reference

### `POST /auth/google`

**Request**
```json
{ "token": "<Google ID token>" }
```

**Response 200**
```json
{
  "message": "Authentication successful",
  "user": {
    "sub": "1234567890",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "email_verified": true,
    "picture": "https://lh3.googleusercontent.com/..."
  }
}
```

**Error 401** — token invalid or expired  
**Error 403** — email not verified by Google
