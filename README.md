# Pipeline — job application tracker

A single-user job application pipeline tracker: kanban board (researching → applied →
interview → offer/rejected), AI-assisted intake (paste a job URL/listing → Gemini extracts
the fields, scores your fit, and drafts a tailored CV + cover letter), interview logs,
company/networking notes, offer comparison, and analytics.

## Local setup

1. **Env vars** — copy `.env` and fill in:
   - `DATABASE_URL` — already set to the local Prisma dev Postgres (see below).
   - `GEMINI_API_KEY` — a free key from [Google AI Studio](https://aistudio.google.com/apikey). Without it, the "add application" AI flow will fail with a clear error; everything else still works.
   - `APP_PASSCODE` — the passcode you'll type to log in. Change this from the placeholder before deploying anywhere shared.
   - `AUTH_SECRET` — random signing secret for the session cookie. A value is already generated for local dev; generate a fresh one for production (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).

2. **Local database** — this project uses Prisma's local dev Postgres (no Docker needed):
   ```bash
   npx prisma dev -d --name job-tracker   # starts it in the background, prints the DATABASE_URL to use
   ```
   If you restart your machine, run that again and update `DATABASE_URL` in `.env` if the port changes (`npx prisma dev ls` shows the current one).

3. **Run the app**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Making schema changes

This project's local dev Postgres is a lightweight (wasm/pglite) engine that isn't fully
wire-compatible with `prisma migrate dev`'s native engine. To change the schema locally:

1. Edit `prisma/schema.prisma`.
2. Generate the SQL diff without touching a live DB:
   ```bash
   npx prisma migrate diff --from-schema <path-to-previous-schema-snapshot> --to-schema prisma/schema.prisma --script > prisma/migrations/<timestamp>_<name>/migration.sql
   ```
   (or `--from-migrations prisma/migrations` once you're on a real Postgres with a working shadow DB).
3. Apply it with a plain `pg` client against `DATABASE_URL` (see any script in git history for the pattern), or just re-run against a real Postgres with `npx prisma migrate dev` once deployed — a real Postgres (Neon/Vercel Postgres) doesn't have this limitation.
4. `npx prisma generate`.

## Deploying

1. Provision a real Postgres (e.g. [Neon](https://neon.tech) or Vercel Postgres) and set `DATABASE_URL` to it in Vercel's env vars — `npx prisma migrate dev` will work normally there.
2. Set `GEMINI_API_KEY`, `APP_PASSCODE`, and a freshly generated `AUTH_SECRET` in Vercel's env vars.
3. Deploy via `vercel` CLI or by connecting the repo in the Vercel dashboard.
