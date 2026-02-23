# REI Dashboard

A real estate investment management dashboard built with React, Vite, Tailwind CSS, and Supabase.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Database:** Supabase (PostgreSQL)
- **Charts:** Recharts
- **Routing:** React Router v7
- **Deployment:** Vercel

## Getting Started

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Once your project is ready, navigate to **Settings → API** to find your project URL and anon key.

### 2. Run Database Migrations

In the Supabase dashboard, go to **SQL Editor** and run the migration files in order:

1. **Create tables:** Copy and paste the contents of `supabase/migrations/001_create_tables.sql` and run it.
2. **Seed data:** Copy and paste the contents of `supabase/migrations/002_seed_data.sql` and run it.

Alternatively, if you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed:

```bash
supabase db push
```

### 3. Set Up Environment Variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deploying to Vercel

### Quick Deploy

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. Add environment variables in Vercel's project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. Vercel auto-detects Vite and configures the build.

### Adding Team Members

In Vercel, go to your project → **Settings → Members** to invite collaborators.

### Vercel Configuration

The included `vercel.json` sets up SPA routing so that all paths resolve to `index.html`.

## Project Structure

```
rei-dashboard/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Base UI primitives (Card, Badge, etc.)
│   │   ├── Layout.tsx    # App shell with navigation
│   │   ├── PropertyCard.tsx
│   │   ├── PropertyHeader.tsx
│   │   ├── FinancialOverview.tsx
│   │   └── ValuationChart.tsx
│   ├── lib/              # Utilities
│   │   ├── supabase.ts   # Supabase client
│   │   ├── format.ts     # Currency, percent, date formatters
│   │   └── utils.ts      # cn() helper
│   ├── pages/            # Route-level components
│   │   ├── Dashboard.tsx
│   │   ├── PropertyDetail.tsx
│   │   └── NotFound.tsx
│   ├── types/            # TypeScript interfaces
│   │   └── database.ts
│   ├── App.tsx           # Router setup
│   ├── main.tsx          # Entry point
│   └── index.css         # Tailwind + theme
├── supabase/
│   └── migrations/       # SQL migrations
│       ├── 001_create_tables.sql
│       └── 002_seed_data.sql
├── vercel.json           # Vercel SPA rewrites
└── .env.example          # Environment variable template
```

## Database Schema

| Table          | Description                                    |
| -------------- | ---------------------------------------------- |
| `clients`      | Client entities (family offices, etc.)         |
| `investors`    | Investment vehicles (LLCs, corps, LPs)         |
| `properties`   | Real estate assets with financial details      |
| `valuations`   | Quarterly NAV snapshots per property           |
| `transactions` | Capital calls, dividends, distributions        |
| `metrics`      | Operational metrics (occupancy, revenue, NOI)  |
