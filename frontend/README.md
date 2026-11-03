# BidAura — Frontend

React 19, Vite, React Router, Zustand, Axios, and Socket.IO client application for the online auction system.

## Development

```sh
npm install
npm run dev
```

In development, the frontend connects to `http://localhost:5000`. Production builds default to `https://online-auction-sytem-mvb2.vercel.app`; set `VITE_API_URL` to override it, then rebuild/redeploy the frontend.

The auction page uses Socket.IO for live bid updates and reconnects automatically. Bid submission uses the authenticated `/api/bids` endpoint, so a temporary socket reconnect does not prevent bidding; accepted bids are broadcast to joined auction rooms. The backend allows cross-origin HTTP and Socket.IO requests without credentialed cookies.

## Main pages

- `/` — searchable catalogue loaded from the MongoDB-backed API, plus persistent signed-in watchlists.
- `/login` and `/register` — account access.
- `/auction/:id` — live lot, countdown, price graph, bid history, and socket bidding.
- `/dashboard` — your listings, recent bid activity, and auction creation.
- `/bids` — paginated bid history and current leading/winning state.
- `/profile` — profile, recent bids, and your listed pieces.
- `/admin` — administrator account and lot controls.
- `/help`, `/privacy`, and `/terms` — marketplace information and auction rules.

Run `npm run lint` and `npm run build` before deploying.
