# IntervueAI — Full Codebase Audit & Fix Walkthrough

This document outlines the results of the comprehensive code audit performed on the IntervueAI application. I analyzed the frontend, backend, database, authentication flow, and deployment configurations to find the root causes of the reported issues.

Below is a breakdown of the problems found, why they happened, what was changed, and how to avoid them in the future.

---

## 🔴 Critical Functional Bugs Fixed

### 1. The "Evaluate Answer" Failure (401 Unauthorized)
**What was found:** In `interview-flow.tsx`, the client was calling the `/api/evaluate-answer` endpoint without passing the user's authentication token.
**Why it happened:** The developer forgot to include the `token` in the options object passed to the `apiJson` helper function. Because the backend route correctly requires authentication (`authMiddleware`), the server rejected every request with a 401 error. The frontend swallowed this error, meaning answers were never evaluated, and scores were lost.
**What was changed:** Added `getStoredToken()` to the `evaluateAnswer` function in `interview-flow.tsx` and passed it to `apiJson`. Also added a redirect to `/login` if the token is missing.

### 2. Fake Hardcoded Dashboard Data
**What was found:** The `DashboardPage` in `dashboard/page.tsx` was displaying fake numbers. It was hardcoded to show `24` interviews and an `88` score as fallbacks if no data existed, instead of showing an empty state. It also had hardcoded past dates like "Oct 24, 2023" and fake roles like "Frontend Engineer (React)".
**Why it happened:** The UI was built with placeholder mock data for design purposes, and the actual API data integration was never fully completed to handle empty states.
**What was changed:** Completely rewrote the `DashboardPage`. Removed all mock data. It now correctly computes and displays the real total interviews, calculates the percentage score correctly (multiplying the 0-10 score by 10 and capping at 100), and renders a helpful "No sessions yet" UI if the user's history is empty.

### 3. Duplicate Input Bug in Interview Flow
**What was found:** The `interview-flow.tsx` component was rendering two separate input methods simultaneously for the user's answer: a large `<textarea>` in the chat bubble area, and a fixed input bar at the bottom. Both updated the same state (`draftAnswer`).
**Why it happened:** Leftover code from a previous UI iteration was not removed when the new bottom input bar was introduced.
**What was changed:** Removed the redundant `<textarea>` from the chat bubble area. The user now types their answer exclusively in the bottom input bar. The chat bubble now correctly displays the *submitted* answer only after the AI evaluation is complete.

### 4. Missing Tailwind Color Tokens
**What was found:** Elements throughout the app were using classes like `bg-aqua-200`, `text-aqua-700`, and `hover:text-navy-700`. However, these specific color shades were not defined in `tailwind.config.ts`.
**Why it happened:** The Tailwind configuration was incomplete. Tailwind silently ignores classes for undefined colors, leading to missing borders and invisible hover states.
**What was changed:** Added the missing shades (`aqua-200`, `aqua-700`, `navy-600`, `navy-700`) to `tailwind.config.ts`.

### 5. Insecure CORS Configuration
**What was found:** The backend `app.js` was configured with `cors({ origin: true })`.
**Why it happened:** This is a common shortcut used during local development to avoid CORS errors. However, in production, `origin: true` means the API will accept requests from *any* website on the internet, which is a major security vulnerability (CSRF risk).
**What was changed:** Changed the CORS configuration to use `process.env.CLIENT_URL`. It now dynamically checks if the origin matches the allowed `CLIENT_URL` (falling back to `http://localhost:3000` for local dev) and strictly blocks unauthorized origins.

### 6. Vulnerable JWT Secret & Startup Safety
**What was found:** The server's `.env` file contained the default placeholder `JWT_SECRET=replace_with_a_long_secret`. If deployed, anyone knowing this string could forge authentication tokens.
**Why it happened:** The placeholder was never updated by the developer.
**What was changed:** 
- Generated a secure, 128-character cryptographically random JWT secret and updated the `.env` file.
- Added a safety check to `server.js` that forcefully exits the process if it detects the placeholder secret or a weak secret (< 32 chars) during startup.
- Updated `.env.example` with instructions on how to generate a secure secret.

---

## 🟡 Code Quality & Architecture Improvements

### 7. Unbound Database Queries
**What was found:** The `/api/report/:userId` endpoint fetched *all* interviews for a user without limits (`Interview.find({ userId })`).
**Why it happened:** This is fine for testing but causes massive performance issues in production as a user's history grows. The payload also included the raw `pdfText` for every interview, which can be megabytes of data.
**What was changed:** Added `.limit(50)` to the query and `.select('-pdfText')` to exclude the heavy PDF text from the report payload.

### 8. Anonymous File Upload Abuse
**What was found:** The `/api/upload-pdf` and `/api/extract-text` routes had no authentication middleware.
**Why it happened:** The developer forgot to secure the routes after testing. This meant anyone could POST files to the server, potentially filling up the disk or abusing the AI processing limits.
**What was changed:** Added `authMiddleware` to both routes in `uploadRoutes.js`.

### 9. Missing `.env.local` for Frontend Deployment
**What was found:** The Next.js frontend lacked an `.env.local` file and the `next.config.mjs` was not passing environment variables correctly for deployment.
**Why it happened:** Next.js requires environment variables used in the browser to be prefixed with `NEXT_PUBLIC_` and defined at build time.
**What was changed:** Created `.env.local` containing `NEXT_PUBLIC_API_URL=http://localhost:5000`. Updated `next.config.mjs` to map this variable and added `remotePatterns` to allow loading avatars from external providers.

### 10. Database Connection Resilience
**What was found:** The MongoDB connection in `db.js` lacked timeout configurations. If Atlas was unreachable, the server would hang indefinitely instead of throwing an error.
**Why it happened:** Default Mongoose settings were used.
**What was changed:** Added `serverSelectionTimeoutMS: 10000` and `maxPoolSize: 10` to `db.js`, along with connection error event listeners to ensure the server fails loudly if the database drops.

### 11. TypeScript Type Inconsistencies
**What was found:** The `InterviewSession` type in `types.ts` defined both `id?: string` and `_id: string`. The dashboard tried to use `interview.id`, which was undefined.
**Why it happened:** MongoDB uses `_id`, but developers often accidentally mix it with standard relational `id` properties.
**What was changed:** Cleaned up `types.ts`, removing the ambiguous `id` property and standardizing on `_id`.

### 12. Weak Password Validation on Server
**What was found:** The frontend enforced a 6-character password minimum, but the backend `/api/auth/register` route did not. An attacker could bypass the UI and register a 1-character password directly via API.
**What was changed:** Added server-side validation for minimum password length (6 chars) and basic email format checking to `authController.js`. Also improved the error handling for duplicate emails.

### 13. UI Component Modernization (`metric-card.tsx`)
**What was found:** The `MetricCard` component was written using outdated design tokens (e.g., `bg-white/5` for a dark mode look) and wasn't actually being used anywhere.
**What was changed:** Rewrote `MetricCard` to use the new light-theme design system (`glass-panel`, `navy`, `aqua`) and added accent colors. It is now ready to be used as a reusable component across the application.

---

## 🛠️ How to Prevent These Issues Moving Forward

1.  **Always Validate Authentication Requirements:** Double-check every API call on the frontend to ensure `getStoredToken()` is passed if the route is protected.
2.  **Server-Side Validation is Mandatory:** Never rely solely on frontend validation (like `minLength={6}`). Always enforce the rules on the backend controller as well.
3.  **Handle Empty States:** When building UI, always plan for the `null` or `length === 0` state before adding hardcoded mock data.
4.  **Keep Tailwind Config Synced:** If you type a new color utility class in JSX (e.g., `text-brand-500`), ensure `brand: { 500: '...' }` is immediately added to `tailwind.config.ts`.
5.  **Environment Variable Safety:** Never commit real secrets to `.env.example` or code. Use validation in `server.js` to crash the app if secrets are missing or insecure during startup.
