# Quick Job Marketplace

A modern gig work platform built with Next.js that connects workers with employers for real job opportunities.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4.2, Radix UI
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth + Email)
- **Animations**: Framer Motion

## Features

- Real-time job matching with radar animation
- Location-based job filtering
- Skills-based filtering
- Profile completion flow
- Job application system
- Worker/Recruiter dashboards
- Dark theme with neon accents
- Apply with one click
- Applied jobs tracker in profile

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Pages

- `/` - Landing page
- `/auth/login` - Login/Signup
- `/dashboard/worker` - Find jobs
- `/dashboard/recruiter` - Find workers
- `/dashboard/profile` - Profile
- `/jobs/post` - Post job