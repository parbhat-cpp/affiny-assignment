# Affiny Assignment

Affiny is a Next.js app with JWT-based authentication, daily check-in rewards, and PostgreSQL persistence via Drizzle ORM.

## Tech Stack

- Next.js 16 / React 19 / TypeScript
- Drizzle ORM + PostgreSQL
- JWT auth with `jsonwebtoken`
- Password hashing with `bcryptjs`
- Testing with Vitest, React Testing Library, and JSDOM
- Docker for local and test databases

## Project Structure

- `app/page.tsx`: auth screen for sign in / sign up
- `app/app/page.tsx`: protected app dashboard with stats and logout
- `app/api/auth/*`: auth and account endpoints
- `db/schema.ts`: database tables and enums
- `lib/auth.ts` and `lib/password.ts`: auth helpers
- `tests/setup/*`: test environment bootstrap and cleanup

## Environment Variables

Create a `.env` file for local development:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/affiny
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=affiny
```

For tests, create a `.env.test` file with test-specific values:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/affiny_test
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=test
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=affiny_test
```

## Setup

1. Set Environment Variables

By setting ```NODE_ENV``` docker will run specific environment accordingly
```bash
NODE_ENV=development | production
```
2. Execute compose up command

For development
```bash
docker compose -f docker-compose.yaml up --watch
```

For production
```bash
docker compose -f docker-compose.yaml up
```

3. Open app container shell for db migration

```bash
docker exec -it affiny_frontend sh
npx drizzle-kit generate
npx drizzle-kit migrate
```

4. Access the app:

Open [http://localhost:3000](http://localhost:3000).

## Test Setup

The test suite uses Vitest with a dedicated PostgreSQL container and a `.env.test` file.

```bash
npm run test:db:up
npm test
```

To shut down the test database:

```bash
npm run test:db:down
```

To execute test cases:

```bash
npm run test
```

Test bootstrap behavior:

- `tests/setup/global.ts` starts the test database and runs Drizzle migrations
- `tests/setup/each.ts` clears tables before every test
- `vitest.config.mts` loads `.env.test` automatically

## Exposed Endpoints

### Pages

- `GET /` — authentication page with login and signup UI
- `GET /app` — protected dashboard showing streak, balance, and earned coins

### API

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | Creates a user, awards signup coins, and sets the auth cookie |
| `POST` | `/api/auth/login` | Authenticates a user, applies the daily check-in flow, and sets the auth cookie |
| `POST` | `/api/auth/logout` | Clears the auth cookie |
| `GET` | `/api/auth/me` | Returns the current authenticated user from the JWT cookie |
| `DELETE` | `/api/auth/delete` | Deletes the current user and related records |

### Auth Flow Notes

- Auth is stored in an HTTP-only `token` cookie.
- Signup awards `300` coins.
- Daily login check-ins award `10` coins.
- Check-in streaks reset when a day is missed.

## Database Model

- `users` — basic user profile and hashed password
- `user_stats` — streak, balance, and last check-in date
- `checkins` — daily check-in history
- `coin_transactions` — coin ledger with transaction type and status
