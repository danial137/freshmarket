
# FreshMarket

A full-stack marketplace application built with React, Vite, Node.js, and Express.

## Project Structure

- `client/` — Customer-facing storefront
- `admin/` — Admin dashboard
- `server/` — Express API

## Tech Stack

- React
- Vite
- Node.js
- Express
- Vercel

## Getting Started

Each application has its own dependencies and environment configuration.

Install dependencies from the corresponding directory:

```bash
cd client
npm install
npm run dev
```

For the admin dashboard:

```bash
cd admin
npm install
npm run dev
```

For the API:

```bash
cd server
npm install
npm run dev
```

## Environment Variables

Create local `.env` files using the corresponding `.env.example` files.

Never commit credentials, tokens, or secrets.

## Deployment

The client, admin dashboard, and server can be deployed as separate Vercel projects from this monorepo.

Configure each project's Root Directory and production environment variables in Vercel.

## License

All rights reserved unless a license is explicitly added.
