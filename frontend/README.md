# Songwriting App Frontend

React 19 + TypeScript + Vite + TailwindCSS frontend for the AI-assisted songwriting application.

## Features

- **Authentication**: Supabase-powered sign up/sign in
- **Songs Management**: Create, read, update, delete songs
- **Responsive UI**: TailwindCSS with mobile-first design
- **Real-time**: Supabase real-time subscriptions ready
- **Type Safety**: Full TypeScript integration

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8001
```

## Project Structure

```
src/
├── components/          # React components
│   ├── AuthForm.tsx    # Login/signup form
│   ├── Header.tsx      # Navigation header
│   ├── SongCard.tsx    # Song display card
│   ├── SongForm.tsx    # Song create/edit form
│   └── SongList.tsx    # Songs listing with CRUD
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── lib/               # Utilities and clients
│   ├── api.ts         # API client for backend
│   └── supabase.ts    # Supabase client config
├── App.tsx            # Main app component
└── main.tsx           # App entry point
```

## Development

The app automatically handles authentication state and redirects to the appropriate views. When authenticated, users can:

1. View their songs library
2. Create new songs with title, artist, lyrics, tags
3. Edit existing songs
4. Delete songs
5. Filter by status (draft, in progress, completed, archived)

## Backend Integration

The frontend communicates with the FastAPI backend at `http://localhost:8001` by default. All API calls include authentication headers automatically when the user is signed in.

## Build

Production builds are optimized and include:
- Tree shaking for minimal bundle size
- CSS optimization via TailwindCSS
- TypeScript compilation
- Asset optimization

Built app is deployable to any static hosting service.
