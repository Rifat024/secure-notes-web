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
npm run dev             # http://localhost:5173
```

## Deploy

Deploy to Vercel with `VITE_API_URL` set to the live API URL. `vercel.json` rewrites every path to `index.html`.
