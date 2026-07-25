# Deploying GemBook to cPanel Shared Hosting

The app is now fully self-hosted: a **static React frontend** + a **PHP + MySQL API**.
No Firebase, no Node on the server. Any standard cPanel host works (PHP 7.4+).

## One-time setup (~10 minutes)

### 1. Create the database
1. cPanel → **MySQL Databases**.
2. Create a database (e.g. `youruser_gembook`).
3. Create a DB user with a strong password.
4. Add the user to the database with **ALL PRIVILEGES**.

### 2. Import the schema
1. cPanel → **phpMyAdmin** → select the new database.
2. **Import** tab → choose `schema.sql` from this project → **Go**.

### 3. Configure the API
Edit `api/config.php` and fill in your real values:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'youruser_gembook');
define('DB_USER', 'youruser_gem');
define('DB_PASS', 'your-password');
```

### 4. Build the frontend

```bash
npm run build
```

This produces the `dist/` folder (it already includes `.htaccess` and the `seed/` images).

### 5. Upload to `public_html`
Upload so the server looks like this:

```
public_html/
├── index.html          ← everything from dist/
├── .htaccess           ← from dist/ (SPA routing)
├── assets/             ← from dist/
├── seed/               ← from dist/ (demo images)
├── api/                ← the api/ folder from this project
│   ├── .htaccess
│   ├── config.php      ← with YOUR credentials
│   └── index.php
└── uploads/            ← create this empty folder (permissions 755)
```

Tip: zip `dist/*` + `api/` locally, upload one zip via cPanel **File Manager**, extract, done.

### 6. Load the demo content
Visit `https://yourdomain.com/seed` → **Reset & Seed Now**.
This wipes all tables and loads the Sri Lankan market dataset
(5 verified dealers, 10 users, 6 LKR listings, 12 posts).

### 7. Manage the platform
Visit `https://yourdomain.com/admin` — live counts, and view/delete for accounts,
listings and posts.

## Updating the app later
Only step 4 + re-upload of `dist/*` are needed. The `api/` folder and database
stay as they are (never overwrite your edited `config.php`).

## Subfolder installs
If the app lives at `https://yourdomain.com/gembook/` instead of the root:
- Build with a base path: add `base: '/gembook/'` in `vite.config.ts`.
- Set `VITE_API_BASE=/gembook/api` in a `.env` file before building.
- Set `UPLOAD_URL_BASE` in `api/config.php` to `/gembook/uploads`.

## Local development
`npm run dev` runs the app at http://localhost:3000 with a built-in **in-memory
dev API** (same REST contract as the PHP backend) — no PHP or MySQL needed on
your machine. Data resets when the dev server restarts; visit `/seed` to reload
the demo dataset.

## Notes
- Uploaded images are compressed in the browser (WebP, ≤1600px) before upload,
  then stored in `uploads/` — keep an occasional eye on disk usage in cPanel.
- The API is open (no passwords by design — identity is name + contact number).
  If spam ever becomes a problem, the simplest fix is a shared secret header
  checked in `api/index.php`.
