# HRConnect — Frontend

React 18 + Vite + TypeScript + Tailwind + Redux Toolkit. Currently the auth API is a **mock JSON** implementation — no real backend call.

## Quick start

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## Mock credentials

Seeded in [src/mocks/users.json](src/mocks/users.json):

| Email | Password | Role |
|-------|----------|------|
| `rino@company.com` | `Password123` | Employee |
| `marcus@company.com` | `Password123` | HR Admin |

You can also register a new account — it's appended to in-memory state and lasts until full page reload.

## Switching to the real backend

The mock lives in [src/api/authApi.ts](src/api/authApi.ts). To switch:

1. Delete the import of `mockAuth` at the top of `authApi.ts`.
2. Uncomment the axios calls and remove the mock calls.
3. The Vite proxy is already wired (`/api` → `https://localhost:5001`) — see [vite.config.ts](vite.config.ts).

No changes needed in the slice, thunks, components, or store.

## Implemented routes

| Route | Page | Public | Notes |
|-------|------|--------|-------|
| `/login` | `LoginPage` | yes | Redirects to `/` when authenticated |
| `/register` | `RegisterPage` | yes | Redirects to `/` when authenticated |
| `/` | `DashboardPage` | protected | Stub page — confirms login worked |
