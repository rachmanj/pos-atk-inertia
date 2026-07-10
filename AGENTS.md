# AGENTS.md

## Cursor Cloud specific instructions

This is a **Laravel 12 + Inertia/React (Vite)** POS/inventory app ("POS Kasir"). It is a single monolith: the PHP backend and the React frontend are served from the same app. Standard commands live in `composer.json` (`setup`, `dev`, `test`) and `package.json` (`dev`, `build`); prefer those over duplicating commands here.

System dependencies (PHP 8.3 + extensions, Composer, MySQL 8) are already baked into the VM snapshot. The startup update script only refreshes project dependencies (`composer install` + `npm install`). The notes below cover the non-obvious runtime setup that the update script intentionally does NOT handle.

### Database (must be started manually each session)
- MySQL is installed but is **not guaranteed to be running** on a fresh VM. Start it before running the app, migrations, or the seeder: `sudo service mysql start`.
- The app connects over TCP as `root` with an **empty password** to database `pos_kasir` (see `.env` / `.env.example`). This DB and the `root@127.0.0.1` native-password user already exist in the snapshot; if the DB is ever missing, recreate with `sudo mysql -e "CREATE DATABASE IF NOT EXISTS pos_kasir CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`.
- MySQL also backs sessions, cache, and the queue (`SESSION_DRIVER`/`CACHE_STORE`/`QUEUE_CONNECTION=database`), so the app will not work at all without it running.
- `.env` is gitignored. If it is missing, `cp .env.example .env` then `php artisan key:generate`.
- Apply schema + seed data with `php artisan migrate --seed`.

### Running the app (dev)
- `composer dev` runs everything concurrently (serve + queue:listen + pail + vite). Alternatively run the two needed pieces separately: `php artisan serve` (backend, `http://127.0.0.1:8000`) and `npm run dev` (Vite, port 5173).
- The app URL is **`http://127.0.0.1:8000`** — NOT `http://localhost:3000` (the `.cursorrules` mention of :3000 is stale; Vite's 5173 only serves assets/HMR).

### Login / seeded accounts
- Seeded users (password `password`): admin — username `admin` / email `admin@gmail.com`; cashier — username `kasir` / email `kasir@gmail.com`. Login accepts username or email.
- There are **no seeded products or categories**. To create a product you must first create a Category (POS-012/POS-013 in `MEMORY.md` explain PPOB/UOM pricing quirks).
- Cashiers must have an open shift (`account.cashier-shifts.create`) before using POS checkout.

### Lint / test / build
- Lint/format: `./vendor/bin/pint` (append `--test` for check-only). NOTE: the repo currently has many pre-existing Pint style deviations, so `pint --test` reports failures on a clean checkout — that is expected, not a regression.
- Tests: `php artisan test` (or `composer test`). Tests use **SQLite `:memory:`** (`phpunit.xml`), so they run without MySQL.
- Frontend build: `npm run build`.
