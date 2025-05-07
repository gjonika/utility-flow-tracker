
# Utility Flow Tracker

A clean, simple dashboard application to track monthly utility usage, meter readings, and payments for personal use.

## Features

- Track multiple utility types (electricity, water, gas, internet, other)
- Record meter readings and payment amounts
- View historical data in a sortable table
- Visualize trends with interactive charts
- Offline-first design with localStorage fallback
- Auto-sync when connection is restored

## Technical Details

This project is built with:

- React and TypeScript
- Tailwind CSS for styling
- Shadcn/UI component library
- Recharts for data visualization
- Zod for data validation
- Supabase for data storage
- Local storage for offline capabilities

## Setup

1. Clone this repository
2. Install dependencies with `npm install`
3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run `npm run dev` to start the development server

## Supabase Setup

Create a table in your Supabase project called `utility_entries` with the following schema:

```sql
create table utility_entries (
  id uuid default uuid_generate_v4() primary key,
  utility_type text not null,
  supplier text not null,
  reading_date date not null,
  reading numeric null,
  unit text null,
  amount numeric not null,
  notes text null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

## Usage

1. Add new utility entries using the "Add New Entry" button
2. View your entries in the History tab
3. Analyze trends in the charts
4. Edit or delete entries as needed
5. Works offline - data will sync when your connection is restored

## License

MIT
