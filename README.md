# TripLink

A lightweight social travel app that lets users create trips, share links, and visualize travel routes on a 3D globe.

## Features

- 🌍 **3D Globe Visualization** - See your trips as arcs on an interactive globe
- 🔗 **Link-Based Sharing** - Share a link, anyone can join
- 👥 **Collaborative** - Multiple travelers per trip
- 📍 **Multi-City Itineraries** - Plan complex routes
- 🔒 **Simple Auth** - No passwords, just name + email

## Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **3D:** React Three Fiber, Three.js
- **State:** Zustand
- **Database:** SQLite (Prisma ORM)
- **Auth:** Cookie-based tokens (no external provider)

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
cp .env.example .env
npm run db:push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

```bash
# .env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Database Commands

```bash
npm run db:push    # Push schema to database
npm run db:studio  # Open Prisma Studio (GUI)
npm run db:migrate # Create migration
```

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── j/[code]/      # Join trip page
│   ├── layout.tsx
│   └── page.tsx       # Main app
├── components/
│   ├── Auth/
│   ├── CreateTrip/
│   ├── Globe/
│   ├── Layout/
│   ├── Profile/
│   ├── TripDetail/
│   └── TripList/
├── lib/
│   ├── auth.ts        # Auth utilities
│   ├── geo.ts         # Globe math
│   └── prisma.ts      # DB client
├── stores/
│   ├── authStore.ts
│   └── tripStore.ts
└── types/
    └── index.ts
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

For production, switch to a hosted database:
- **Turso** (SQLite edge)
- **Supabase** (Postgres)
- **PlanetScale** (MySQL)

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create/login user |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/recover` | POST | Recover by email |
| `/api/auth/logout` | POST | Clear session |
| `/api/trips` | GET | List user's trips |
| `/api/trips` | POST | Create trip |
| `/api/trips/[id]` | GET/PATCH/DELETE | Trip CRUD |
| `/api/trips/[id]/leave` | POST | Leave trip |
| `/api/trips/[id]/revoke` | POST | Revoke share link |
| `/api/trips/join/[code]` | GET | Preview trip |
| `/api/trips/join/[code]` | POST | Join trip |
| `/api/cities/search` | GET | Search cities |

## License

MIT
