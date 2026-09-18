# NCLEX Hub

The application is split into a React frontend and a Node/PostgreSQL backend using Prisma ORM.

## Structure

- `frontend/` - React and Vite client
- `backend/` - Node HTTP API, controllers, models, and database scripts
- `Nclex_App/` - legacy static frontend retained for reference during migration

## Development

Place `DATABASE_URL` in `.env` at the project root (copy `.env.example`), then run:

```bash
npm run setup
npm run seed
```

To start development after the database is ready, run:

```bash
npm run dev
```

This launches the backend at `http://localhost:3000` and the React frontend at
`http://localhost:5173`. Vite proxies `/api` and `/uploads` to the backend.

An optional `backend/.env` can override the root configuration when needed.

## Database

The Prisma schema is in `backend/prisma/schema.prisma`.

- `npm run setup` generates Prisma Client and applies the schema to PostgreSQL.
- `npm run seed` creates the default administrator and initial categories.
- `npm --prefix backend run db:migrate -- --name <name>` creates a development migration.
- `npm --prefix backend run db:studio` opens Prisma Studio.

## Production

```bash
npm start
```

This builds the React application and starts the backend at
`http://localhost:3000`. The backend serves both the API and the React build.
