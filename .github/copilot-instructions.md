# Skidmark Tour App - Copilot Instructions

## Project Overview
React 18 web application for the Skidmark Tour sim-racing community. Displays race history, league standings, server status, and admin tools. Built with Create React App.

**Domain context**: This is the frontend for a sim-racing group that runs both ad-hoc races and structured leagues with points-based standings.

## Architecture

### Component Structure
- **Feature-based organization**: Components grouped by feature in `src/components/` (e.g., `Leagues/`, `ServerStatus/`, `AdminPortal/`)
- **Shared components**: Reusable UI in `src/components/shared/` (currently `PageHeader`)
- **Routing**: All routes defined in [NavBar.js](src/components/NavBar.js) using `react-router-dom`

### Data Flow
- **Global state**: `enums` and `lists` fetched once in [App.js](src/App.js), passed down via props (not context)
- **API calls**: Use utility functions `getAPIData()` and `postAPIData()` in `src/utils/` - never use `fetch()` directly for the main API
- **Name mapping**: Use `NameMapper` class in `src/utils/Classes/NameMapper.js` for track/vehicle/weather name lookups

### External Services
See `.env.example` for all required environment variables. Key services:
- `REACT_APP_AMS2API` - Main API for race data, leagues, OCR (used by `getAPIData`/`postAPIData`)
- `REACT_APP_SERVER_LOC` - Dedicated game server API for live session status
- `REACT_APP_BOT_SERVER_URL` / `REACT_APP_BOT_SERVER_TOKEN` - Discord bot API
- `REACT_APP_TWITCH_CLIENT_ID` / `REACT_APP_TWITCH_CLIENT_SECRET` - Twitch stream detection

### Key Features
- **Leagues** (`/leagues`, `/league/:id`): Structured racing seasons with configurable points systems (position-based + optional fastest lap bonus). Tracks standings, schedules, and per-driver performance analytics.
- **Race History** (`/history`): Browsable archive of all sessions with filtering and pagination
- **Server Status** (`/server`): Live polling of game server state (track, players, session type)
- **Admin Portal** (`/admin`): Protected admin tools for data management (key-based auth via sessionStorage)

## Code Conventions

### Styling
- **CSS Modules preferred**: Use `ComponentName.module.css` with `styles.className` pattern
- **Legacy CSS**: Some components use plain `.css` files (e.g., `Leagues.css`, `ServerStatus.css`)
- **UI Libraries**: Bootstrap (react-bootstrap) for layout/forms, MUI for advanced components (Tabs, Charts, Cards)

### Component Patterns
```jsx
// Standard component structure
import styles from './ComponentName.module.css';
import PageHeader from '../shared/PageHeader';
import getAPIData from '../../utils/getAPIData';

const ComponentName = ({ enums, lists }) => {
  // State, effects, handlers
  return (
    <div>
      <PageHeader title="Page Title" subtitle="Optional subtitle" />
      {/* Content */}
    </div>
  );
};
```

### API Data Patterns
```jsx
// Fetching data - always use utility functions
const data = await getAPIData('/api/endpoint');
const result = await postAPIData('/api/endpoint', { payload }, true); // true to parse JSON response

// Name lookups - use NameMapper
NameMapper.fromTrackId(trackId, lists.tracks?.list)
NameMapper.fromVehicleClassId(classId, lists.vehicle_classes?.list)
```

## Key Files
- [App.js](src/App.js) - Root component, fetches global enums/lists
- [NavBar.js](src/components/NavBar.js) - All route definitions
- [getAPIData.js](src/utils/getAPIData.js) / [postAPIData.js](src/utils/postAPIData.js) - API utilities
- [NameMapper.js](src/utils/Classes/NameMapper.js) - ID-to-name conversion utilities

## Development Commands
```bash
npm run dev   # Start development server (or npm run up)
npm run build # Production build
npm start     # Serve production build
npm test      # Run tests (aspirational - minimal coverage currently)
```

## Common Gotchas
- Lists may be undefined initially - always use optional chaining: `lists.tracks?.list`
- API responses often wrapped in `response` property - `getAPIData` handles this automatically
- Server status polling runs every 60 seconds - be aware of cleanup in useEffect
