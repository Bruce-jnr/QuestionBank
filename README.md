# CBRUCENCLEX

CBRUCENCLEX is an NCLEX preparation platform with a React student experience and an administrative content-management system. It supports focused practice sessions, NGN question formats, study guides, performance tracking, premium content, blog publishing, video placeholders, and email-based account recovery.

## Technology

- React 19 and Vite
- Node.js and Express
- PostgreSQL with Prisma ORM
- Resend transactional email
- PM2 and Nginx-ready production deployment

## Project structure

```text
frontend/                  React application
backend/                   Express API and services
backend/prisma/schema.prisma
                           PostgreSQL data model
backend/database/          Prisma runner and seed script
backend/public/uploads/    Administrator-uploaded images
zoom_s3_pipeline_setup.md  Planned video-processing pipeline
```

## Main features

### Student experience

- Secure login and email OTP password reset
- Practice and test modes
- Filtering by client need and question type
- Multiple-choice, multiple-response, and NGN question formats
- Physical drag-and-drop ordering with accessible move controls
- Immediate rationales in practice mode
- Final scores, answer review, history, and performance summaries
- Database-managed study guides and a future video library

### Administration

- Secure login and email OTP password reset
- Student and subscription-tier management
- Question creation, editing, publishing, archiving, search, filters, and pagination
- JSON and CSV imports with duplicate detection
- Separate blog-category and study-topic management
- Study-domain and module management
- Blog publishing with image uploads

### Security

- Five authentication attempts per 15-minute window
- CORS origin allowlist
- CSP, production HSTS, clickjacking and MIME-sniffing protection, referrer policy, and permissions policy
- JWT-protected student and administrator APIs
- Hashed passwords and hashed, expiring password-reset OTPs

The included rate limiter uses application memory. Multi-instance deployments should use a shared Redis-backed limiter.

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL
- A verified Resend sending domain for production email

## Environment configuration

Copy `.env.example` to `.env` in the project root and replace every placeholder:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/cbrucenclex
PORT=3000
NODE_ENV=development

JWT_SECRET=replace-with-at-least-32-random-characters
ADMIN_USERNAME=replace-with-admin-username
ADMIN_PASSWORD=replace-with-at-least-16-random-characters
ADMIN_EMAIL=admin@cbrucenclex.com

CORS_ORIGINS=http://localhost:5173

RESEND_KEY=re_replace_with_your_resend_api_key
RESEND_FROM_EMAIL=CBRUCENCLEX <noreply@cbrucenclex.com>
CONTACT_EMAIL=support@cbrucenclex.com
```

`RESEND_FROM_EMAIL` must use an address on the exact domain verified in Resend. An optional `backend/.env` can override root values.

The frontend uses relative `/api` and `/uploads` URLs, so `VITE_API_URL` is not currently required. In production, Nginx should proxy those paths to the backend, or the backend can serve the built frontend directly.

## Local setup

```bash
npm install
npm run install:all
npm run setup
npm run seed
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

`npm run setup` generates Prisma Client and synchronizes the PostgreSQL schema. Vite proxies `/api` and `/uploads` during development.

## Database workflow

The schema is located at `backend/prisma/schema.prisma`.

```bash
npm run setup
npm run seed
npm --prefix backend run prisma:generate
npm --prefix backend run db:push
npm --prefix backend run db:studio
```

This repository currently does **not** contain a `backend/prisma/migrations` history. Therefore, `npx prisma migrate deploy` has no migrations to apply. The current deployment workflow is `npm --prefix backend run db:push` after backing up the production database.

To adopt a migration-based workflow, create and commit an initial migration in development, review it, and then use `prisma migrate deploy` on the VPS. Do not create development migrations directly in production.

## Question imports

The administrator Question Bank accepts `.csv` and `.json` files. Imports are limited to 500 questions per request. Duplicate external IDs or matching normalized stem/prompt combinations are skipped.

CSV columns:

```text
externalId,stem,prompt,options,correctAnswers,rationale,clientNeed,questionType,scoringMethod,difficulty,status,accessTier
```

Example drag-and-drop question:

```csv
externalId,stem,prompt,options,correctAnswers,rationale,clientNeed,questionType,scoringMethod,difficulty,status,accessTier
drag-001,"A nurse is preparing medication.","Arrange the actions in the correct order.","a:Verify the order|b:Identify the client|c:Administer the medication|d:Document administration","a|b|c|d","Use the medication-administration sequence.",MANAGEMENT_OF_CARE,DRAG_DROP,ZERO_ONE,0.5,PUBLISHED,PREMIUM
```

For `DRAG_DROP`, the sequence in `correctAnswers` is significant. Set content to `PUBLISHED` for it to appear in student sessions; `DRAFT` content remains visible only in administration.

Supported question types:

- `MULTIPLE_CHOICE`
- `MULTIPLE_RESPONSE`
- `EXTENDED_MULTIPLE_RESPONSE`
- `DRAG_DROP`
- `HOT_SPOT`
- `MATRIX_GRID`
- `CLOZE_DROP_DOWN`
- `CASE_STUDY`
- `RATIONALE_PAIRED`
- `BOW_TIE`

Supported client needs:

- `MANAGEMENT_OF_CARE`
- `SAFETY_AND_INFECTION_CONTROL`
- `HEALTH_PROMOTION_AND_MAINTENANCE`
- `PSYCHOSOCIAL_INTEGRITY`
- `BASIC_CARE_AND_COMFORT`
- `PHARMACOLOGICAL_AND_PARENTERAL_THERAPIES`
- `REDUCTION_OF_RISK_POTENTIAL`
- `PHYSIOLOGICAL_ADAPTATION`

## Validation

```bash
npm run lint
npm run build
npm --prefix backend test
```

The backend test command is configured, although the repository currently has no automated backend test suites.

## Production deployment

From the project root on the VPS:

```bash
npm ci
npm run install:all
npm --prefix backend run prisma:generate
npm --prefix backend run db:push
npm run build
cd /var/www/cbrucenclex/backend
pm2 start npm --name cbrucenclex-api -- start
pm2 save
```

The backend verifies PostgreSQL during startup and logs `Database connected successfully.` before accepting requests.

### Nginx example

```nginx
server {
    listen 80;
    server_name cbrucenclex.com www.cbrucenclex.com;

    root /var/www/cbrucenclex/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable HTTPS and use production values such as:

```env
NODE_ENV=production
CORS_ORIGINS=https://cbrucenclex.com,https://www.cbrucenclex.com
```

Uploaded files in `backend/public/uploads/` are application data. Preserve and back up this directory across deployments.

## Video pipeline

The student video area is present, but ingestion and processing are not connected yet. See `zoom_s3_pipeline_setup.md` for the planned Zoom/S3 implementation.
