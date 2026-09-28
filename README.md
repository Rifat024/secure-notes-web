# Secure Notes Web

React frontend for [secure-notes-api](https://github.com/Rifat024/secure-notes-api), built with Vite and hand-written CSS: no UI kit, component library or template. It has a dark and light theme (it follows the system setting), a sidebar layout and responsive pages that work down to phone width.

## Features

- Register and log in (JWT stored in `localStorage`, sent as a `Bearer` token)
- **My notes:** create, edit, delete, and page through your own notes
- **Posts:** publish posts, read everyone's posts, and open any author's posts (aggregation scenario 2, `$lookup`)
- **Users by interest:** grouped view with an optional interest filter (aggregation scenario 1)
- **Profile:** update your name, password, and interests
- **Admin only:** add, edit, change the role of, and delete users; view everyone's notes, with an owner filter

Every list uses the API's `page`/`limit` pagination.

## Run locally

```bash
cp .env.example .env    # VITE_API_URL=http://localhost:4000
npm install
npm test                # 32 Vitest + Testing Library unit tests
npm run dev             # http://localhost:5173
```

## Deploy

```bash
npm run deploy -- https://secure-notes-api-ebon.vercel.app   # or set VITE_API_URL in .env.production
```

[`scripts/deploy.sh`](scripts/deploy.sh) runs these steps:

1. Checks the API's health endpoint.
2. Sets `VITE_API_URL` on the Vercel project.
3. Runs a local build.
4. Deploys to production.
5. Confirms the live site returns 200.

`vercel.json` rewrites every path to `index.html`. The API's `CORS_ORIGIN` must include the frontend URL.
