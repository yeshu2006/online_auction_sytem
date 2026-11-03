# BidAura

A simple collectible-auction marketplace with a React/Vite client, Express/MongoDB API, and Socket.IO auction rooms. Buyers can create accounts, save lots, submit bids, review price movement and bid history; sellers can list items; administrators can review accounts and remove listings.

The interface uses a white, black, and orange palette. Prices and the profile balance are demonstration values only: the application does **not** process payments, deposits, escrow, refunds, or seller payouts.

## Features

- Sign-up and sign-in with bcrypt password hashing and expiring JWTs.
- Public catalogue, auction search, lot details, and live time-left display.
- Authenticated auction creation and seller-owned lot list.
- Account watchlists stored in MongoDB and protected by JWT authentication.
- Authenticated, server-validated bids with current price and bid-history persistence.
- Socket.IO auction rooms with authenticated bid submission, acknowledgement, live broadcasts, and reconnect synchronization.
- Price-history graph based on accepted bids.
- Dashboard, profile, and paginated personal bid history with current leading/outbid/ended state.
- Protected admin screens and APIs for account review and auction moderation.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm.
- MongoDB. A local standalone `mongod` works for single-process development. Production must use a replica-set deployment (such as MongoDB Atlas) so bid records and current auction prices can be committed in transactions.
- A strong, unique `JWT_SECRET` kept outside source control.

## Run locally

1. Start MongoDB.
2. Copy `backend/.env.example` to `backend/.env` and set your MongoDB connection string and a private JWT secret:

   ```dotenv
   MONGO_URI=mongodb://127.0.0.1:27017/auction_system
   PORT=5000
   JWT_SECRET=replace-with-a-long-random-secret
   ```

3. In `backend`, install dependencies and start the API:

   ```sh
   npm install
   npm run dev
   ```

4. In a second terminal, start the frontend:

   ```sh
   cd frontend
   npm install
   npm run dev
   ```

The frontend defaults to `http://localhost:5000`. Set `VITE_API_URL` to the backend origin when using a different API host.

On a local standalone MongoDB server, the development backend serializes bids per auction within that one server process. This compatibility mode is not suitable for multiple backend instances. Production bid processing requires MongoDB transactions and therefore a replica set.

## Accounts and administration

New registrations always create regular user accounts. Do not make a client-side role selector or expose a public admin-registration path. Provision an administrator through the guarded operator seed below; the admin UI and admin API both require the stored `admin` role.

### Marketplace seed and production smoke test

Run these commands from `backend` against the intended MongoDB database. The seed promotes or updates the configured admin account, creates a seed seller, and adds one auction and one bid in each of the nine marketplace categories. It is repeatable and requires an explicit confirmation variable:

```powershell
$env:BIDAURA_ADMIN_EMAIL = "admin@example.com"
$env:BIDAURA_ADMIN_PASSWORD = "<set a private password>"
$env:ALLOW_MARKETPLACE_SEED = "YES"
npm run seed:marketplace
```

Keep the password in the process environment only; do not commit it to source control. For production bidding, the MongoDB connection must use a replica set.

To exercise the live API, start the backend with `NODE_ENV=production`, then in another terminal set the same admin credentials and the API origin and run:

```powershell
$env:BIDAURA_ADMIN_EMAIL = "admin@example.com"
$env:BIDAURA_ADMIN_PASSWORD = "<the configured password>"
$env:SMOKE_API_URL = "https://your-backend.example.com"
npm run smoke:production
```

The smoke test checks database readiness, category bid histories, admin/JWT access, registration, listing, self-bid rejection, transactional bid persistence, and watchlist behavior. It creates temporary test accounts and a listing, then removes them.

## API overview

| Method | Path | Access | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Create a regular account |
| `POST` | `/api/auth/login` | Public | Sign in |
| `GET` | `/api/auth/profile` | Signed in | Read the current profile |
| `GET` | `/api/auctions` | Public | Browse auctions; supports `status`, `search`, `page`, `limit` |
| `GET` | `/api/auctions/mine` | Signed in | Get the current user's listings |
| `POST` | `/api/auctions` | Signed in | Create a listing |
| `GET` | `/api/auctions/:id` | Public | Read a lot |
| `GET` | `/api/bids/auction/:auctionId` | Public | Read the latest bid history |
| `POST` | `/api/bids` | Signed in | Place a bid through the REST API |
| `GET` | `/api/bids/mine` | Signed in | Read paginated personal bid history; total is in `X-Total-Count` |
| `GET` | `/api/watchlist` | Signed in | Read the current user's saved auctions |
| `POST` | `/api/watchlist` | Signed in | Save an auction to the current user's watchlist |
| `DELETE` | `/api/watchlist/:auctionId` | Signed in | Remove an auction from the current user's watchlist |
| `GET` | `/api/admin/users` | Admin | Review registered accounts |
| `DELETE` | `/api/admin/auction/:id` | Admin | Remove a lot while preserving bid history |
| `GET` | `/health` | Public | Check database readiness |

Protected HTTP routes use `Authorization: Bearer <token>`. Socket.IO accepts a JWT in the connection `auth.token` field. Clients join a public `join_auction` room for updates; `place_bid` requires an authenticated socket and returns an acknowledgement. Bidder IDs supplied by clients are not used to determine identity.

## Deploy

The Render blueprint is in `render.yaml`. Set `MONGO_URI` and `JWT_SECRET` in the backend service environment; the blueprint deliberately leaves the JWT secret unsynced so no deployment secret is committed in source. Use a fresh strong secret and rotate any secret that has previously been exposed. HTTP and Socket.IO CORS allow browser requests from any origin, without credentialed cookies; protected endpoints still require bearer-token authentication.

The production MongoDB URI must point to a replica set. Do not use the single-process development fallback for multi-instance deployment. Configure MongoDB network access and a least-privilege database user for the backend.

## Checks

```sh
cd backend
npm test

cd ../frontend
npm run lint
npm run build
```

Backend unit tests cover bid validation. The production smoke test additionally requires a running backend and configured MongoDB replica set.
