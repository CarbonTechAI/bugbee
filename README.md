# BugBee

Internal Bug & Feature Tracking System. Built with Next.js 14 and Supabase.

## Setup

### 1. Environment Variables
Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Internal Token for "Auth" (Shared Access Code)
BUGBEE_INTERNAL_TOKEN=secret123
```

> **Note**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` is not used by the application logic (we use the Service Role key on the server), but Supabase client might expect it if initialized differently. Our `utils/supabase.ts` uses the Service Role Key purely server-side.

### 2. Database Schema
Run the SQL queries found in `schema.sql` in your Supabase SQL Editor to create the necessary tables (`bugs`, `features`, `activity_log`).

### 3. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

- **Auth**: Simple shared-token authentication. The frontend prompts for an Access Code, which is stored in LocalStorage and sent via `x-bugbee-token` header to API routes.
- **API**: All database interactions happen via Next.js API Routes (`app/api/*`) using the Supabase Service Role Key to bypass Row Level Security constraints for this internal tool.
- **Legacy**: The old `qa-dashboard.html` has been moved to `legacy/` and marked inactive.

## Features

- **Bug Reporting**: Capture severity, reproduction steps, environment, and logs.
- **Feature Requests**: Track priority and description.
- **Inbox**: Filterable list of all items.
- **Activity Log**: Auto-generated validation trail for status changes and comments.
- **Markdown Export**: One-click copy of bug reports for GitHub/Linear.
