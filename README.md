# NCLEX Hub

The application is split into a React frontend and a Node/MySQL backend.

## Structure

- `frontend/` - React and Vite client
- `backend/` - Node HTTP API, controllers, models, and database scripts
- `Nclex_App/` - legacy static frontend retained for reference during migration

## Development

Place the database configuration in `.env` at the project root (copy
`.env.example`), then run:

```bash
npm run dev
```

This launches the backend at `http://localhost:3000` and the React frontend at
`http://localhost:5173`. Vite proxies `/api` and `/uploads` to the backend.

An optional `backend/.env` can override the root configuration when needed.

## Production

```bash
npm start
```

This builds the React application and starts the backend at
`http://localhost:3000`. The backend serves both the API and the React build.
