## Solution Overview

### Backend

- **Non‑blocking I/O**: Replaced `readFileSync/writeFileSync` with async fs/promises in `src/routes/items.js` to avoid blocking the event loop.
- **Pagination & search**: `/api/items` now supports `q`, `page`, and `pageSize` (with `limit` as a legacy alias). Returns `{ items, total, page, pageSize, totalPages }`.
- **Data validation**: `POST /api/items` now validates `name` (non‑empty string), `price` (number), and optional `category`.
- **Stats caching**: `/api/stats` caches computed totals/average price and invalidates on file mtime changes; route fixed to mount at `/api/stats` and respects `DATA_PATH` overrides.
- **Testing**: Jest + Supertest cover items routes (list, search, get by id, 404, create/persist) using an isolated fixture file.

### Frontend

- **Memory leak fix**: Items page fetches use `AbortController`; abort on unmount to prevent setState after unmount.
- **Pagination & search UI**: Items page now has search and page controls that call the new paginated API.
- **Virtualization**: Integrated `react-window` `FixedSizeList` to keep large lists smooth.
- **Create item flow**: Added form on the home page; posts to backend, refreshes list, and shows validation errors.
- **Stats on home**: Fetches `/api/stats` via DataContext and displays total items and average price cards.
- **Styling & UX polish**: Tailwind via local build (tailwind/postcss/autoprefixer) with skeleton loaders and improved layout.
- **Frontend tests**: React Testing Library test covers items + stats rendering with mocked fetch; Jest config added for CSS/module mocks.

### Trade‑offs & Notes

- Data is still in JSON files; async I/O and caching reduce pain, but a real DB would replace this in production.
- Stats cache uses file mtime; with a DB, switch to query-level caching or an in-memory cache with invalidation on writes.
- Virtualization uses fixed row height for simplicity; dynamic heights would need `VariableSizeList`.

### How to Run

- **Backend**: `cd backend && npm install && npm test -- --runInBand` then `npm start`.
- **Frontend**: `cd frontend && npm install && npm test` then `npm start`.
