# BidAura — Frontend

React 19, Vite, React Router, Zustand, Axios, and Socket.IO client application for the online auction system.

## Development

```sh
npm install
npm run dev
```

By default, the frontend connects to `http://localhost:5000`. Set `VITE_API_URL` to the backend origin when it is hosted elsewhere.

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
