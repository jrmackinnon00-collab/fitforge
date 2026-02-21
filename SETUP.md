# FitForge Setup Guide

A complete beginner-friendly guide to get FitForge running on your machine and deployed.

---

## Prerequisites

Before starting, make sure you have:
- **Node.js 18+** installed (download from https://nodejs.org)
- A **Google account** (for Firebase)
- An **Anthropic account** (for Claude AI plan generation)

---

## Step 1: Install Dependencies

Open a terminal in the `fitforge` folder and run:

```bash
npm install
```

This installs all packages including React, Firebase, Tailwind, etc.

---

## Step 2: Set Up Firebase

### 2a. Create a Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Enter a project name (e.g. `fitforge-app`) and click **Continue**
4. Disable Google Analytics (optional) then click **Create project**

### 2b. Enable Google Authentication

1. In your Firebase project, click **Authentication** in the left sidebar
2. Click **Get started**
3. Under "Sign-in method" tab, click **Google**
4. Toggle **Enable** to ON
5. Enter your email as the support email
6. Click **Save**

### 2c. Create a Firestore Database

1. In Firebase, click **Firestore Database** in the left sidebar
2. Click **Create database**
3. Select **Start in test mode** (allows all reads/writes during development)
4. Choose your preferred region and click **Enable**

### 2d. Get Your Firebase Config Values

1. In Firebase, click the **gear icon** next to "Project Overview" -> **Project settings**
2. Scroll down to **"Your apps"** section
3. Click the **web icon** `</>` to add a web app
4. Register your app with a nickname (e.g. `fitforge-web`)
5. You will see a config block like this:

```js
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXX",
  authDomain: "fitforge-app.firebaseapp.com",
  projectId: "fitforge-app",
  storageBucket: "fitforge-app.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdefabcdef"
};
```

Copy each of these values - you will need them in the next step.

---

## Step 3: Get Your Claude API Key

1. Go to https://console.anthropic.com
2. Click **"API Keys"** in the top menu
3. Click **"Create Key"**
4. Give it a name (e.g. `fitforge`) and click **Create**
5. Copy the key - it starts with `sk-ant-...`

**Important:** Store this key safely. You cannot view it again after closing the dialog.

---

## Step 4: Configure Environment Variables

1. In the `fitforge` folder, find the file named `.env.example`
2. Make a **copy** of it and rename the copy to `.env`
   - On Windows: right-click -> Copy, then paste and rename
   - In terminal: `cp .env.example .env`
3. Open `.env` in any text editor and fill in your values:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=fitforge-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=fitforge-app
VITE_FIREBASE_STORAGE_BUCKET=fitforge-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:abcdefabcdef
VITE_CLAUDE_API_KEY=sk-ant-api03-XXXXXXXXXXXXXXXXXXXX
```

Replace each value with the actual values from Firebase (Step 2d) and Anthropic (Step 3).

**Security Note:** The `.env` file is already in `.gitignore` and will NOT be committed to Git. Never share it publicly.

---

## Step 5: Run the App Locally

Start the development server:

```bash
npm run dev
```

You should see output like:
```
  VITE v5.x.x  ready in 234 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open http://localhost:5173 in your browser. You should see the FitForge login screen.

**Test login:** Click "Sign in with Google" and sign in with your Google account.

---

## Step 6: Build for Production

To create an optimized production build:

```bash
npm run build
```

This creates a `dist/` folder with all static files ready to deploy.

---

## Step 7: Deploy to Vercel

### Option A: Drag and Drop (Easiest)

1. Go to https://vercel.com and create a free account (sign in with GitHub)
2. Go to https://vercel.com/new
3. Run `npm run build` locally to generate the `dist` folder
4. Drag and drop your `dist` folder onto the Vercel deploy page
5. Your app will be live at a URL like `https://fitforge-xxxxx.vercel.app`

**Note:** With drag-and-drop, you need to re-deploy manually after each change. Use Option B for automatic deployments.

### Option B: Connect GitHub (Recommended)

1. Push your code to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/fitforge.git
   git push -u origin main
   ```

2. Go to https://vercel.com/new
3. Click **"Import Git Repository"** and select your fitforge repo
4. In the **"Environment Variables"** section, add all 7 variables from your `.env` file:
   - Click "Add" for each variable
   - Name: `VITE_FIREBASE_API_KEY`, Value: your API key
   - Repeat for all 7 variables
5. Click **Deploy**

Vercel will automatically redeploy whenever you push to GitHub.

### Post-Deploy: Fix Google OAuth for Production

After deploying, you need to add your Vercel URL to Firebase's allowed origins:

1. Go to Firebase Console -> Authentication -> Settings -> Authorized domains
2. Click **Add domain**
3. Enter your Vercel URL (e.g. `fitforge-xxxxx.vercel.app`)
4. Click **Add**

---

## PWA Icons (Optional)

To display proper icons when users "Add to Home Screen":

1. Create two PNG icons:
   - `icon-192.png` (192x192 pixels)
   - `icon-512.png` (512x512 pixels)
2. Place them in the `public/` folder

You can use any image editor or a free tool like https://favicon.io to generate icons.

---

## Troubleshooting

**"Firebase: Error (auth/unauthorized-domain)"**
- Add your domain to Firebase Authentication -> Settings -> Authorized domains

**"Failed to generate plan. Check your API key."**
- Verify your `VITE_CLAUDE_API_KEY` in `.env` is correct
- Check that your Anthropic account has credits

**"Firestore permission denied"**
- Make sure Firestore is in test mode (allows all reads/writes)
- Rules should read: `allow read, write: if true;`

**App shows blank white screen**
- Open browser DevTools (F12) -> Console tab for error messages
- Verify all 7 environment variables are set correctly

**Google sign-in popup blocked**
- Allow popups for localhost in your browser settings

---

## Project Structure

```
fitforge/
├── public/              # Static files (icons, etc.)
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── BottomNav.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── StatCard.jsx
│   │   └── ThemeToggle.jsx
│   ├── data/
│   │   └── exercises.js # 85 exercises database
│   ├── hooks/
│   │   ├── useClaudeAI.js
│   │   └── useFirestore.js
│   ├── layouts/
│   │   └── MainLayout.jsx
│   ├── screens/
│   │   ├── Dashboard.jsx
│   │   ├── ExercisePicker.jsx
│   │   ├── LoginScreen.jsx
│   │   ├── LogWorkout.jsx
│   │   ├── MyPlans.jsx
│   │   ├── PlanEditor.jsx
│   │   ├── ProfileScreen.jsx
│   │   ├── ProfileSetup.jsx
│   │   └── Progress.jsx
│   ├── store/
│   │   ├── useAuthStore.js
│   │   ├── useProfileStore.js
│   │   └── useThemeStore.js
│   ├── App.jsx
│   ├── firebase.js
│   ├── index.css
│   └── main.jsx
├── .env                 # Your secrets (not in Git)
├── .env.example         # Template for secrets
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```
