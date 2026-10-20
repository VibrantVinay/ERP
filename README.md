# Rift · Restaurant ERP

A local restaurant operations prototype with a warm cream, olive and dark green interface. It includes a point of sale, order and kitchen queue, table management, inventory, purchasing, guest CRM, staff, finance, reporting and administration routes.

## Run locally

1. Install Node.js 20.6 or newer.
2. Copy `.env.example` to `.env` and fill in the Supabase project URL and publishable/anon key.
3. In this folder, run `npm start`.
4. Open `http://127.0.0.1:4173` and sign in with an account created in Supabase Auth.

Use the local server rather than opening `index.html` directly. The app uses JavaScript modules, API routes and Supabase Auth cookies.

## Supabase setup

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql) in its SQL Editor.
2. In Supabase Auth, invite/create the restaurant owner account. Public sign-ups are not provided by Rift.
3. Copy the Project URL and publishable key (or legacy anon key) into `.env` as `SUPABASE_URL` and `SUPABASE_ANON_KEY`. Never use a `service_role` or secret key in this app.
4. The first authenticated user gets a Rift restaurant workspace automatically. The app seeds sample restaurant records the first time that workspace is opened.
5. To share the same restaurant with another Auth user, create/invite that user in Supabase Auth, then run this in the SQL Editor after replacing both UUIDs:

   ```sql
   insert into public.restaurant_memberships (restaurant_id, user_id, role)
   select restaurant_id, 'INVITED_USER_UUID', 'manager'
   from public.restaurant_memberships
   where user_id = 'OWNER_USER_UUID'
   limit 1;
   ```

   The `/users` page is currently demo/configuration data and does not invite or authorize Supabase users.

The SQL schema enables row-level security and scopes data to restaurant memberships. Auth sessions are stored in secure, HTTP-only cookies in production. API calls use the signed-in user's Supabase token and the public key; no service-role key is needed.

## Deploy to GitHub and Vercel

1. Push the repository to GitHub. `.gitignore` excludes `.env`, `.vercel/`, local storage and dependencies; commit `.env.example`, never `.env`.
2. In Vercel, import the GitHub repository. Select the **Other** framework preset and use the repository root. This is a static HTML/CSS/JavaScript app with a Node.js API function, not a Vite/React build.
3. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` under the Vercel project's Environment Variables for Preview and Production, then deploy.
4. In Supabase Auth URL Configuration, set the production Rift URL as the Site URL and add the Vercel preview/production URLs to the redirect allow list if you use email invitations.
5. Open the deployment, sign in, and verify the POS and record create/edit flows. GitHub pushes to the production branch trigger Vercel redeployments.

`vercel.json` sends client-side routes such as `/pos` back to `index.html`; `/api/*` is handled by the Vercel Node function in `api/[...path].js`.

## Restaurant routes

| Path | Workspace |
| --- | --- |
| `/dashboard` | Sales, active tickets, tables, inventory alerts and safety tasks |
| `/pos` | Menu cart, order type, discount, sample GST, payment method and kitchen send |
| `/orders` | Dine-in, takeaway, delivery and QR order register |
| `/kitchen` | Station-based KOT/KDS queue, prep states and delayed ticket tracking |
| `/tables` | Table availability, occupancy, reservations and waitlist |
| `/reservations` | Guest bookings, deposits, party size and arrival status |
| `/delivery` | Delivery zones, drivers, promised times and dispatch status |
| `/menu` | Menu categories, pricing, modifiers, allergens and availability |
| `/recipes` | Ingredient mapping, portion costs and margin records |
| `/inventory` | Stock levels, reorder points, batch/expiry records and alerts |
| `/suppliers` | Supplier directory, purchase orders, approvals and receiving |
| `/stock-movements` | Waste, transfers, adjustments and count variance |
| `/customers` | Customer profiles, visit history, segments and consent field |
| `/loyalty` | Coupons, rewards, points and campaign records |
| `/feedback` | Ratings, complaints, follow-up assignment and resolution |
| `/staff` | Team, shifts, attendance, leave and payroll status |
| `/tasks` | Cleaning, training, hygiene and temperature checks |
| `/equipment` | Equipment maintenance, service schedules and repair costs |
| `/finance` | Sales, expenses, supplier dues, taxes and reconciliation records |
| `/reports` | Sales, menu margins, demand, branch and staff report catalogue |
| `/branches` | Location records and branch-level sales indicators |
| `/users` | User and role setup records |
| `/audit` | Searchable local change history |
| `/settings` | Restaurant profile, GST, hardware, payments, delivery links and alerts |

## Available interactions

The workspaces support create, edit, delete, search, status filtering, workflow changes and CSV export. The POS supports dine-in/takeaway/delivery/QR orders, discounts, sample GST, payment method and kitchen tickets; orders can be split or merged. Restaurant records and audit events persist in Supabase. The app refreshes shared data every 15 seconds. Settings can export a JSON backup or restore starter demo records.

## API

- `GET /api/health`, `/api/snapshot`, `/api/dashboard`, `/api/audit`
- `GET /api/auth/session`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET/POST /api/modules/:module/records`
- `PUT/DELETE /api/modules/:module/records/:id`
- `POST /api/demo/reset`

Data and integration values are examples. Payment terminals, online ordering platforms, printers, barcode scanners, customer messaging, payroll and GST filing are not connected. Roles in the `/users` area are demo records; restaurant membership controls data access, but per-role permissions and the invitation workflow are not yet implemented. Configure Supabase Auth users deliberately before sharing the deployment.

## Stack

- Frontend: HTML, CSS and vanilla JavaScript ES modules.
- Backend: Node.js HTTP server for local use and a Vercel Node function for deployment.
- Database and authentication: Supabase Postgres, Auth and row-level security.
- Fonts: Fraunces for headings and Nunito Sans for interface text.
