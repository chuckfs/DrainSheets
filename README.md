# DrainSheets

A focused, Smartsheet-style workspace built for commercial real estate brokers. You organize everything as **Workspaces → Folders → Sheets → Rows**, edit data in a fast spreadsheet grid, attach files and notes to any row, share sheets with your team, and search across everything — without the bloat (and the price) of Smartsheet.

> **For the person testing this:** this guide gets you running locally in a few minutes, then walks you through everything to try. You don't need to be a developer — just follow the steps in order.

---

## What you can do in the app

- **Workspaces, folders, and sheets** — organize your work in a folder tree, like Finder.
- **Spreadsheet grid** — type into cells, copy/paste, fill-down, undo/redo, sort, filter, resize and pin columns.
- **Sheet templates** — start a new sheet as a Tenant Prospect List, Deal Tracker, or Contact Database.
- **Row detail** — open any row to see its fields, notes, attachments, and activity in one panel.
- **Documents with version history** — attach files, preview them in-app, and keep old versions when you re-upload.
- **Notes & activity** — leave notes on a row or sheet; see a timeline of who changed what.
- **Sharing** — share a sheet with specific people (Viewer / Commenter / Editor / Admin) or with a **link**.
- **Send update by email** — email a row's details + attachments to someone, right from the app.
- **Import** — bring in a CSV or Excel file as a new sheet.
- **Search** — press `⌘K` (or `Ctrl+K`) to jump to any sheet, row, contact, document, or note.

---

## Get it running (about 10 minutes)

### 1. Install these first

| Tool | Version | Why |
|------|---------|-----|
| [Node.js](https://nodejs.org/) | 20 or newer | Runs the app (includes `npm`) |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Latest | Runs the local database |
| [Git](https://git-scm.com/) | Any recent | To download the code |

> Make sure **Docker Desktop is open and running** before the database steps below.

### 2. Download and install

```bash
git clone <repo-url> drainsheets
cd drainsheets
npm install
```

### 3. Start the database

```bash
npm run db:start    # first run downloads images — can take a few minutes
```

### 4. Set up the environment file

```bash
cp .env.local.example .env.local
```

Then get your local database keys:

```bash
npx supabase status -o env
```

Copy `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from that output into `.env.local`. Keep `NEXT_PUBLIC_APP_URL=http://localhost:3000`.

> Email sending and a couple of features are optional to test — see "Optional: email" below. You can ignore the `RESEND_*` lines for now.

### 5. Build the database and load demo data

```bash
npm run db:reset      # creates all the tables (run this any time you pull new code)
npm run db:seed-beta  # loads a demo company with sample sheets, rows, and users
```

### 6. Run it

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and log in with the demo owner account:

| Login | Password |
|-------|----------|
| `beta-owner@drainsheets.local` | `BetaSeed2026!` |

(There are also admin and editor demo accounts — `beta-admin1@…`, `beta-editor1@…`, etc. — all with the same password, handy for testing what different roles can see.)

---

## What to test (the fun part)

Sign in as the owner, then try each of these:

**Getting around**
- [ ] Click into a **workspace** and expand/collapse **folders** in the tree.
- [ ] Open a **sheet** — the active one highlights in orange in the sidebar.

**The grid**
- [ ] Click a cell and **type**; press `Tab`/`Enter` to move; the active cell gets an orange ring.
- [ ] **Copy/paste** a block of cells; select a column of cells and **fill down**; press `Ctrl/⌘+Z` to **undo**.
- [ ] Use the **Sort** and **Filter** controls above the grid (e.g. sort by a number column, or "Status is …").
- [ ] **Add a row** and **add a column**; **resize** a column by dragging its edge.

**Row detail**
- [ ] Double-click a row number (or use the row menu) to open the **row drawer** — check the Details, Notes, Attachments, and Activity tabs.

**Documents + version history**
- [ ] In a row or sheet, **upload a file**, then **preview** it.
- [ ] Click **Versions** on a file, **upload a new version**, then try **Restore** and **Download** on older versions.

**Notes, activity, pagination**
- [ ] Add a few **notes**; watch the **Activity** timeline update.
- [ ] If a list gets long, a **"Load more"** button appears instead of loading everything at once.

**Sharing**
- [ ] Open **Share** on a sheet. Pick a role and read the plain-English description of what it can do.
- [ ] Create a **share link**, copy it, and open it while logged in as a different demo user — they should land on the sheet with access.

**Email update** *(only works if you set up email — see below)*
- [ ] Open a row → **Send update** → fill in a recipient and send.

**Search**
- [ ] Press `⌘K` / `Ctrl+K` and search for a sheet, row, or contact. Use the arrow keys + Enter.

**Import**
- [ ] Use **Import** to bring in a small CSV and confirm it becomes a new sheet.

**The look**
- [ ] Overall: warm off-white background, orange accents, clean grid, and "empty" screens that show a friendly icon + next step.

---

## Optional: turn on email sending

The "Send update" feature uses [Resend](https://resend.com). To test it, add these two lines to `.env.local` (otherwise the app shows a clear "email isn't configured yet" message — everything else still works):

```
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=DrainSheets <updates@yourdomain.com>
```

Restart `npm run dev` after adding them.

---

## Good to know

- **Light theme only (for now).** The app ships in its light "warm paper + orange" theme. A dark theme is built into the design but there isn't a toggle in the UI yet.
- **Re-run `npm run db:reset` after pulling new code.** It rebuilds the database with the latest tables. ⚠️ It wipes local data, so run `npm run db:seed-beta` again afterward to reload the demo.
- **It's all demo/local data.** Nothing here is real — reset and re-seed as often as you like.

---

## Handy commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the app |
| `npm run db:start` / `db:stop` | Start / stop the local database |
| `npm run db:reset` | Rebuild the database (wipes data) |
| `npm run db:seed-beta` | Load the demo company + users |
| `npm run test` | Run the automated tests |
| `npm run typecheck` | Check the code for type errors |
| `npm run lint` | Check code style |
| `npm run db:types` | Regenerate DB types (only needed if you change the schema) |

---

## Troubleshooting

- **`db:start` fails** → Docker Desktop isn't running. Open it, wait for it to finish starting, try again.
- **Login does nothing / "auth" errors** → Your `.env.local` keys don't match. Re-run `npx supabase status -o env` and copy the three keys again.
- **App is empty after login** → Run `npm run db:seed-beta`.
- **A new feature (file versions / share links) seems missing** → Run `npm run db:reset` then `npm run db:seed-beta` to apply the latest tables.
- **`npm run test` fails with a "binding" / native module error** → The dependencies were installed on a different computer. Run `rm -rf node_modules && npm install`, then try again.
- **Port 3000 already in use** → `npm run dev -- -p 3001` (and set `NEXT_PUBLIC_APP_URL=http://localhost:3001` in `.env.local`).

---

## Tech stack

Next.js 15 + React 19 + TypeScript · Tailwind CSS v4 · Supabase (database, auth, file storage). Built to deploy on Vercel.
