# Secure Notes Web

A minimal React frontend for [secure-notes-api](https://github.com/Rifat024/secure-notes-api). It aims to be functional, not polished, since the task grades the backend. I wrote it by hand with Vite and React, without a UI kit or template.

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
