# Software Development Documentation

**Project:** Adricop Industries (KABUUBI Industries — VOLT EV ordering platform)  
**Version:** 1.0.0  
**Stack:** Node.js (Express), MySQL, static HTML/CSS/JavaScript  
**Document purpose:** Describe architecture, deployment, and maintenance for developers and assessors.

---

## 1. Purpose and scope

This web application supports an electric-vehicle (EV) showcase and ordering workflow: visitors browse models, register or sign in, configure and submit orders, and (for an admin role) review all orders. A contact form stores messages for display on the contact page.

The solution is split across three environments typical of a class or small production setup: **Firebase Hosting** delivers the customer-facing HTML/CSS/JS; **Railway** runs the **Express.js** API; **Aiven** hosts **MySQL**. The browser calls the API over HTTPS using a configurable base URL so the same frontend can target a local server or Railway.

---

## 2. System architecture

**Logical layers**

| Layer | Responsibility |
|--------|----------------|
| **Presentation** | Pages under `public/` (e.g. `index.html`, `about.html`, `products.html`, `orders.html`, `contact.html`), styles in `public/css/`, client scripts in `public/js/`. |
| **Application / API** | `server.js` — Express routes for JSON and static file serving when run locally or on Railway. |
| **Data** | MySQL accessed via `mysql2` in `config/db.js`; schema includes users, cars, orders, feedback (and related fields as implemented in your SQL scripts). |

**Request flow (production)**

1. User opens the site on **Firebase Hosting** (`*.web.app` / `*.firebaseapp.com`).
2. Scripts resolve the API base from `public/js/env.js` (`window.RAILWAY_API_BASE`) and `public/js/api-config.js` (optional `<meta name="api-base">` override).
3. `fetch()` calls go to the **Railway** URL (e.g. `https://<service>.up.railway.app/...`).
4. Express handles the route, runs SQL via `mysql2`, returns JSON.
5. **CORS** is restricted when `CLIENT_URL` lists the Firebase origins; otherwise permissive defaults apply for same-origin or development.

**Local development**

Running `npm start` (`node server.js`) serves both `public/` and the API on one origin (e.g. `http://localhost:3000`), so `RAILWAY_API_BASE` can remain empty.

---

## 3. Main API surface (`server.js`)

- **Health:** `GET /health` — plain `ok` for monitors (e.g. Railway).
- **Auth:** `POST /register`, `POST /login` — JSON body; user identity for orders is also reflected in client `localStorage` on the orders page.
- **Orders:** `GET /api/orders` (query: `user_id`, `full_name` for admin behaviour), `GET /api/order/:id`, `POST /api/orders`, `POST /api/orders/update`, `POST /api/orders/delete`.
- **Catalog:** `GET /cars` — vehicle list for products and order forms.
- **Contact:** `POST /contact`, `GET /messages`.
- **Pages (local/Railway only):** `GET /`, `/about`, `/contact`, `/products`, `/myorders`, `/dashboard` — `sendFile` to HTML under `public/` when not using Firebase for those routes. The admin dashboard (`/dashboard`) uses `dashboard.html` / `dashboard.js` / `dashboard.css` and requires a logged-in user whose `full_name` is `admin` (enforced in client JS).

The server binds to `0.0.0.0` and `process.env.PORT` for cloud compatibility.

---

## 4. Database configuration (`config/db.js`)

- Connection is built from **`DATABASE_URL`** / **`MYSQL_URL`** (preferred for Aiven) or discrete variables (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` / `MYSQLDATABASE`).
- **`MYSQL_DATABASE`** (or `MYSQLDATABASE`) can override the database name in the URI path when the provider’s URL still points at `defaultdb` but tables live in another schema (e.g. `adricop_industries`).
- **Aiven:** TLS is enabled when the host matches Aiven’s domain or when forced; `ssl-mode` query parameters from the URI are stripped to avoid `mysql2` warnings.
- **Security note:** Passwords in the sample app are stored as plain text in the database; production systems should use hashing (e.g. bcrypt) and HTTPS only.

---

## 5. Deployment summary

| Service | Role | Notes |
|---------|------|--------|
| **Aiven** | MySQL | Create service; copy **Service URI**; ensure app uses the same **database name** as in Workbench/migrations. |
| **Railway** | Express | Set `DATABASE_URL`, optional `MYSQL_DATABASE`, `CLIENT_URL` (Firebase URLs). Build via `Dockerfile` / `railway.json`. Start: `node server.js`. |
| **Firebase** | Static hosting | `firebase.json` uses `public` as root; rewrites map clean paths (`/about`, `/contact`, etc.). Deploy: `firebase deploy --only hosting`. Headers can limit caching of HTML/JS/CSS so updates appear quickly. |

**Repository layout (high level)**

- `server.js`, `config/db.js`, `package.json`
- `public/` — all deployable static assets and entry HTML
- `Dockerfile`, `railway.json` — container deploy on Railway
- `firebase.json`, `.firebaserc` — Firebase project binding

---

## 6. Maintenance and troubleshooting

- **API not reachable from Firebase:** Confirm `RAILWAY_API_BASE` includes `https://`; set `CLIENT_URL` on Railway to both Firebase hostnames; check browser Network tab and CORS errors.
- **Empty data:** Confirm Railway `DATABASE_URL` database segment matches the schema where tables were created; use `MYSQL_DATABASE` if the URI cannot be edited.
- **Stale UI after deploy:** Hard refresh, incognito window, or bump query strings on script tags; verify `firebase deploy` completed for the correct Firebase project (`firebase use`).

## 7. Dependencies and key files

**Runtime (from `package.json`):** `express` (HTTP API), `mysql2` (MySQL driver), `cors` (cross-origin requests from Firebase). **Node.js** ≥ 18.

**Client scripts:** `api-config.js` builds absolute API URLs; `env.js` holds the Railway base for Firebase deployments; `orders.js` drives login/register and order CRUD; `script.js` powers the contact form and message list.

**Styling:** Global styles in `public/css/style.css`; page-specific rules in `orders.css`, `products.css`.

---

## 8. Assumptions and limitations

This documentation reflects the intended deployment pattern (Firebase + Railway + Aiven). Features such as password hashing, automated tests, and formal API versioning are not in scope for the described codebase but are recommended before any public production launch.

---

*End of document.*

