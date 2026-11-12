# Punchcard

A staff time clock kiosk with an admin area for timesheets, rosters and team management. The front end uses plain ES modules with no frameworks or build step. Data is stored in Postgres (Supabase in production), behind a small Node.js API, so several kiosks and admin screens can share it. It deploys to Vercel. The only dependencies are `postgres` (the database driver) and nodemailer, used for roster emails.

## Features

### Kiosk (staff clock-in)

- **PIN login:** staff enter a 4-digit PIN on the on-screen keypad or the keyboard (digits, `Backspace` to delete, `Esc` to clear).
- **Clock in / clock out.**
- **Breaks:** start a break and end it.
- **Clock-out confirmation:** shows the break time that was recorded and lets staff change it (quick options or ±5 min) before they confirm.
- **Shift summary:** after clocking out, staff see hours worked, their in/out times and the break length.
- **Auto-reset:** the kiosk returns to the PIN screen after each action, and also after a period with no input.
- **Update my details:** after entering their PIN, staff can change their own name, email and PIN. A new PIN must be typed twice, and leaving the PIN fields empty keeps the current one.
- **Demo hints:** demo PINs can be shown under the keypad (can be turned off in config).

### Admin (email and password sign-in)

- **Sign in:** the admin dashboard needs an email and password. The first time you click **Admin**, you're asked to create the first admin account. Sessions last 7 days on that browser; **Sign out** ends the session and returns to the kiosk.

- **Overview:** "Today on the floor" status counts (on shift, on break, late, upcoming, finished) and a live status table. Admins can clock out anyone who is still clocked in.
- **Timesheets:** browse week by week and filter by staff member. Add or edit entries (date, in/out, break minutes), see total hours and pay, and **export to CSV**.
- **Roster:** switch between two views:
  - **Week:** a grid of shifts by staff and day. Click a cell to add a shift or a shift to edit it. Shift clashes are checked. **Copy last week's shifts** in one click. On phones this becomes a day-by-day list.
  - **Day:** a timeline by time of day. Only the people working that day get a row on an hour axis (06:00–22:00, widened for earlier or later shifts) with their shifts drawn as bars. A "now" line marks the current time, and a bottom row shows how many people are working each hour. Click an empty hour to add a shift starting then, or click a bar to edit it. On small screens the hours scroll sideways, staff names stay pinned, and the view opens scrolled to the current time.
- **Send roster:** when the week's roster is done, click **Send roster** on the Roster tab to email each person their own shifts (day, time, area and total hours), in the language the admin is using. The dialog shows each person's status: *Not sent yet*, *Sent*, *Failed* (with the error) or **Changed since sent** if their shifts were edited after the last email. *Only new & changed* selects just the people who need an update. Without SMTP configured, emails are printed to the server log instead of sent. SMS isn't supported yet; phone numbers are stored for later.
- **Staff / Team:** add, edit, deactivate or delete staff. Each person has a name, role, unique 4-digit PIN (with a random PIN generator), hourly rate, and optional email and phone. Shows hours worked this week. PINs can be shown or hidden.

### General

- **Two languages:** English and Vietnamese (Tiếng Việt). Switch with the language button in the kiosk or admin header. The labels, dates, durations, toasts and CSV export all change language.
- **Mobile friendly:** works from 320px phones up to desktop. On phones the header controls shrink to compact buttons, list rows stack, popups become bottom sheets, buttons are at least 44px tall, and notch/home-bar areas are respected.
- Light and dark themes. Each device remembers its own theme and language.
- Uses the **Inter** typeface, with JetBrains Mono for times and numbers.
- **Database storage:** data is kept in Postgres (Supabase). Screens sync every 10 seconds, so a clock-in on the kiosk appears in the admin view.
- Demo data can be added to an empty database with `npm run db:setup -- --demo`: 8 staff, a three-week roster around today, and clock entries for past shifts.

## Try the demo (no database)

Click **Try demo** in the kiosk header to explore the whole app (kiosk, admin, timesheets, roster, staff) with sample data and no database. The demo runs entirely in the browser:

- It starts with the same sample data as `npm run db:setup -- --demo`: 8 staff, a three-week roster and past clock entries. The staff have placeholder `@example.com` addresses.
- Admin opens straight away, with no sign-in.
- Your changes are saved in this browser's localStorage, so reloading the page keeps you in the demo. The banner at the top has **Reset data**, which restarts with fresh sample data, and **Exit demo**, which deletes the demo data and goes back to the real app.
- Nothing is sent. **Send roster** only records each email as a preview.

The server starts without a `DATABASE_URL` too. Every API request then answers `503`, and the kiosk shows a notice that offers the demo instead of a database. This means a Vercel deployment without Supabase, or any static host serving the browser files, works as a demo site.

## Deploy to Vercel + Supabase

Vercel serves the browser app from its CDN and runs the API as a serverless function (`api/index.js`). Vercel has no database of its own, so the data lives in a Supabase Postgres database.

### 1. Create the Supabase database

1. Create a project at [supabase.com](https://supabase.com). Pick the region closest to your venue, and note the database password.
2. Open **Connect** (top of the dashboard) → **Connection string** → **Transaction pooler**. Copy the URI (port `6543`) and fill in the password. This is your `DATABASE_URL`.
3. Create the tables from your computer:

   ```bash
   cp .env.example .env      # then paste DATABASE_URL into .env
   npm install
   npm run db:setup          # add -- --demo for demo staff and shifts
   ```

   (Or paste `schema.sql` into Supabase's **SQL Editor** and run it.)

4. **Already using the SQLite version?** Copy your existing data, including admin accounts, with:

   ```bash
   npm run db:migrate-sqlite            # reads data/punchcard.db
   ```

The schema turns on row-level security for every table without adding policies. Supabase's public REST API therefore can't read or change any data, even with the project's public `anon` key. The app connects directly as the database owner, which bypasses RLS.

### 2. Deploy on Vercel

1. Push the project to GitHub (or GitLab/Bitbucket) and **Import** it at [vercel.com/new](https://vercel.com/new). Leave **Framework Preset** as *Other*: `vercel.json` already sets the build command and output folder.
2. Under **Environment Variables**, add:

   | Variable | Value |
   | -------- | ----- |
   | `DATABASE_URL` | The Supabase transaction pooler URI |
   | `APP_TZ` | Your venue's time zone, e.g. `Asia/Ho_Chi_Minh` or `Australia/Sydney`. Vercel runs in UTC, so without this "today" and roster weeks would be wrong. |
   | `COOKIE_SECURE` | `true` |
   | `SMTP_*`, `MAIL_FROM` | Optional, for roster emails (see below) |

3. Deploy. Then open the site and click **Admin** to create the first admin account (or run `npm run admin` locally against the same `DATABASE_URL`).
4. Optional: in **Settings → Functions → Function Region**, choose the region nearest your Supabase project. Every request queries the database, so keeping the function and the database close keeps the kiosk responsive.

You can also deploy from the terminal with `npx vercel` (and `npx vercel --prod`).

> Supabase's free plan pauses a project after a week without activity. A kiosk in daily use keeps it awake; otherwise restore it from the dashboard.

## Run locally

**Requirements:** [Node.js](https://nodejs.org/) **22.13 or newer** and a Postgres database: your Supabase project (a separate one for development is a good idea) or a local Postgres.

```bash
cd punch-card-app
npm install
cp .env.example .env     # set DATABASE_URL
npm run db:setup -- --demo
npm start
```

Then open **http://localhost:5173** and click **Admin** to create the first admin account. The npm scripts load `.env` automatically.

### Admin accounts

- **First admin:** created in the browser the first time anyone clicks **Admin** (only possible while no admin exists).
- **More admins, or a forgotten password:** run (with `DATABASE_URL` pointing at the database you want to change):

  ```bash
  npm run admin
  ```

  It asks for an email. For a new email it creates an admin account; for an existing one it sets a new password and signs that admin out everywhere.
- Passwords need at least 8 characters and are stored as scrypt hashes. Sessions are kept in an `HttpOnly`, `SameSite=Strict` cookie.

Environment variables:

| Variable  | Default              | Description                  |
| --------- | -------------------- | ---------------------------- |
| `DATABASE_URL` | required        | Postgres connection string (Supabase: the transaction pooler URI, port 6543) |
| `APP_TZ`  | server's zone        | Time zone used for "today" and roster weeks, e.g. `Australia/Sydney` |
| `PORT`    | `5173`               | HTTP port (local server only) |
| `DB_POOL_MAX` | `5`              | Database connections per server instance |
| `COOKIE_SECURE` | `false`        | Set to `true` when the app is served over HTTPS, so the session cookie is only sent over HTTPS |
| `TRUST_PROXY` | `false`          | Take the client IP from `X-Real-IP`/`X-Forwarded-For` (for rate limiting). Automatic on Vercel; set it only behind your own reverse proxy |
| `SMTP_HOST` | not set            | SMTP server. Leave unset to only preview emails in the server log |
| `SMTP_PORT` | `587`              | SMTP port (`465` uses TLS automatically) |
| `SMTP_SECURE` | auto             | `true` for TLS on connect (port 465), `false` for STARTTLS |
| `SMTP_USER` / `SMTP_PASS` | not set | SMTP login |
| `MAIL_FROM` | `SMTP_USER`        | From address, e.g. `"Punchcard <roster@yourshop.com>"` |

### Sending roster emails

Set the SMTP variables in `.env` (locally) or in Vercel's environment variables. For example, with Gmail you need 2-step verification turned on and an [app password](https://myaccount.google.com/apppasswords):

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM="Punchcard <you@gmail.com>"
```

Outlook/Office 365 uses `smtp.office365.com` on port `587`. Any other provider works with its SMTP details. Add each staff member's email in **Staff → Edit**. The demo staff use test addresses that all go to one Gmail inbox, tagged by first name (`vanhuu3005+maya@gmail.com`, `vanhuu3005+tomas@gmail.com`, and so on), so you can see exactly what each person receives. To use a different test inbox, change `TEST_INBOX` in `js/seed.js`. That only affects new demo data; edit existing staff in **Staff → Edit**.

> The real app needs its API and a database. Without them only **Try demo** works, and that also needs the files served over HTTP (for example `npm start` with no `DATABASE_URL`), not `index.html` opened directly.
>
> **Security:** the admin dashboard and its API need a signed-in admin. The kiosk only gets what the person who entered their PIN is allowed to see: their own shift, hours and details, never other people's PINs. Repeated wrong PINs (10 in 5 minutes) or failed sign-ins (10 in 15 minutes) from one device are blocked for a while; the counts are kept in the database so they hold across serverless instances. Vercel serves HTTPS; if you run `npm start` on a shared network instead, put it behind HTTPS (for example a reverse proxy) and set `COOKIE_SECURE=true` and `TRUST_PROXY=true`.

### Demo PINs

| Name           | Role           | PIN    |
| -------------- | -------------- | ------ |
| Maya Chen      | Shift Lead     | `1234` |
| Tomás Rivera   | Barista        | `2580` |
| Aisha Bello    | Kitchen        | `1111` |
| Liam O’Connor  | Kitchen        | `4321` |
| Priya Nair     | Front of House | `7777` |
| Jonas Weber    | Barista        | `3690` |
| Sofia Rossi    | Front of House | `1357` |
| Daniel Kim     | Manager        | `8642` |

### Reset demo data

To start over, delete the tables in Supabase (**Table Editor**, or `DROP TABLE staff, shifts, entries, notifications, admins, sessions, rate_limits CASCADE;` in the SQL Editor), then run `npm run db:setup -- --demo`. This also deletes admin accounts, so the first click on **Admin** asks you to create one again.

## API

**Public and kiosk** (no sign-in; kiosk calls need the staff member's PIN):

| Method | Path        | Body / response |
| ------ | ----------- | --------------- |
| `GET`  | `/api/auth` | `{ admin, setupNeeded }`: the signed-in admin (or `null`) and whether the first admin still needs creating |
| `POST` | `/api/auth/setup` | `{ name, email, password }`. Creates the first admin and signs in. Only works while no admin exists |
| `POST` | `/api/auth/login` | `{ email, password }`. Signs in and sets the session cookie |
| `POST` | `/api/auth/logout` | Ends the session |
| `GET`  | `/api/kiosk` | `{ onClock }`: how many people are clocked in |
| `POST` | `/api/kiosk/me` | `{ pin }`. The staff member's own details, status, today's shift and entries |
| `POST` | `/api/kiosk/clock` | `{ pin, action, breakMinutes? }` with action `in`, `bstart`, `bend` or `out` |
| `POST` | `/api/kiosk/profile` | `{ pin, name, email, newPin? }`. Staff updating their own details |

**Admin** (needs a signed-in admin, otherwise `401`):

| Method | Path        | Body / response |
| ------ | ----------- | --------------- |
| `GET`  | `/api/data` | Returns `{ staff, shifts, entries }` |
| `GET`  | `/api/notify?week=YYYY-MM-DD` | Staff with shifts that week (Monday date), their email and latest notification status |
| `POST` | `/api/notify` | `{ week, staffIds, lang }`. Emails each person their shifts and returns per-person results (`sent`, `preview`, `failed`, `skipped`) |
| `POST` | `/api/sync` | `{ upsert: { staff?, shifts?, entries? }, delete: { staff?, shifts?, entries? } }`. Rows are upserted by `id`, deletes take ids. Applied in one transaction. |

All `POST` requests must be JSON (`content-type: application/json`). The browser sends only the rows that changed, so edits from different screens don't overwrite each other.

Every send is recorded in the `notifications` table. Admin accounts are in `admins` and sign-in sessions in `sessions` (only a hash of each session token is stored). Failed sign-in and PIN attempts are counted in `rate_limits`. Other tables: `staff`, `shifts` (deleted along with their staff member) and `entries` (kept after a staff member is deleted; breaks are stored as JSON).

## Configuration

Edit `js/config.js`:

| Option          | Default  | Description                                       |
| --------------- | -------- | ------------------------------------------------- |
| `defaultTheme`  | `'dark'` | `'dark'` or `'light'`                             |
| `defaultLang`   | `'en'`   | `'en'` or `'vi'` (until a device picks its own)   |
| `currency`      | `'$'`    | Currency symbol for pay (`$`, `£`, `€`)           |
| `autoReturn`    | `4`      | Seconds before the kiosk resets after an action   |
| `showDemoHints` | `true`   | Show demo PINs under the kiosk keypad (always shown in the demo) |

## Project structure

```
index.html          Entry page
dev-server.js       Local server: static files + the API
handler.js          The JSON API (admin + kiosk routes), shared by dev-server.js and Vercel
api/index.js        Vercel serverless function (all /api/* requests)
vercel.json         Vercel build, output folder and /api rewrite
auth.js             Password hashing, sessions, rate limiting
db.js               Postgres connection and queries
schema.sql          Database tables (run by `npm run db:setup`)
notify.js           Roster emails: message builder + SMTP sending (nodemailer)
scripts/admin.js    `npm run admin`: create an admin or reset a password
scripts/db-setup.js `npm run db:setup`: create tables, optionally add demo data
scripts/migrate-sqlite.js  `npm run db:migrate-sqlite`: copy data from the old SQLite database
scripts/build.js    `npm run build`: copies the browser files into public/ for Vercel
css/styles.css      Styles (light/dark themes)
js/app.js           State, event wiring, kiosk & admin actions
js/config.js        App settings
js/i18n.js          English / Vietnamese strings and t() helper
js/storage.js       API client (load + diff-based save); theme/lang prefs
js/kiosk.js         Kiosk actions: PIN check, clock in/out, profile (run by the server, and by the demo)
js/demo.js          "Try demo": answers API requests in the browser from localStorage
js/seed.js          Demo data generator (used by `npm run db:setup -- --demo` and the demo)
js/viewmodel.js     Derives view data from state
js/morph.js         Minimal DOM diffing
js/html.js          Tagged-template HTML helper
js/utils.js         Date/time & formatting helpers
js/views/           Kiosk, sign-in, admin, modal and shared view templates
```
