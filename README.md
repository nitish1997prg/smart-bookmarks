# Smart Bookmarks (Next.js + Supabase)

**Live Demo:** https://smart-bookmarks-orcin-phi.vercel.app/ 
**GitHub Repo:** https://github.com/nitish1997prg/smart-bookmarks

A smart bookmark app built using **Next.js App Router**, **Supabase (Auth + DB + Realtime)**, and **Tailwind CSS**.

## Tech Stack
- Next.js (App Router) + TypeScript
- Supabase (Auth, Postgres Database, Realtime)
- Tailwind CSS
- Vercel (deployment)

## Features Implemented
- Google OAuth signup/login (no email/password)
- Add bookmarks (private per user)
- Delete bookmarks (only your own)
- Optimistic UI updates for create/delete actions
- Realtime updates across tabs (Supabase Realtime)
- Deployed on Vercel

## Problems Encountered and Solutions

### 1) Google authentication was showing an error

**Symptom:**  
Google login failed during authentication flow.

**Cause:**  
Google provider was not enabled/configured correctly in Supabase.

**Fix:**  
- Enabled Google Auth Provider in Supabase (`Auth -> Providers -> Google`)
- Added Google OAuth Client ID + Client Secret
- Added correct redirect URLs:
  - In Google Cloud OAuth Client: `https://<project-ref>.supabase.co/auth/v1/callback`
  - In Supabase Auth URL configuration:
    - `http://localhost:3000/auth/callback`
    - `https://<vercel-domain>/auth/callback`

### 2) Add/Delete actions were not always refreshing in the UI

**Symptom:**  
Bookmarks were being created/deleted in the database, but UI didn�t always update immediately.

**Cause:**  
Server Actions update the DB, but client state must be updated explicitly for immediate UX.  
Delete events may also not always update the same tab instantly without optimistic UI handling.

**Fix:**  
- Optimistic UI updates for add/delete using React state
- `router.refresh()` to keep server snapshot in sync
- Supabase Realtime subscription to keep multiple tabs in sync

**Key code patterns used:**  
- Add: insert via server action, then `setBookmarks([inserted, ...prev])`
- Delete: optimistic remove in UI, call server action, then `router.refresh()`
- Realtime: `postgres_changes` subscription on `bookmarks` filtered by `user_id`

## How to Run Locally

### 1) Install
```bash
npm install
```

### 2) Add environment variables
Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3) Run the app
```bash
npm run dev
```

Open `http://localhost:3000`.
