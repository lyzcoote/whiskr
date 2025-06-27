# Whiskr

Whiskr is a SvelteKit application that provides a simple and efficient way to manage your tasks and notes. It is designed to be fast, lightweight, and easy to use, making it an ideal choice for developers and users who want a straightforward task management solution.

## Setup

### Prerequisites
- Bun.js (recommended) or Node.js
- A MySQL compatible database (e.g., MySQL, MariaDB, etc.) or use the provided docker-compose setup for local development.
- Docker (optional, for local development with docker-compose)

To get started, clone the repository and install the dependencies:

```bash
git clone https://github.com/lyzcoote/whiskr.git
```

Install the dependencies (we highly recommend using [bun](https://bun.sh/)):

```bash
bun install
```

To start developing, first we need to set up the database. 
If you are using Docker, you can run the DB locally.

First, modify your `.env` file to configure the database connection. You can use the provided `.env.example` as a template:

Then, start the database with:

```bash
bun run db:start
```

And then run the database migrations using Drizzle:

```bash
bun run db:push
```

And finally, you can start the Vite server:

```bash
bun run dev

# or start the server and open the app in a new browser tab
bun run dev -- --open
```

## Building

To create a production version of Whiskr, you can run the following command:

```bash
bun run build
```

You can preview the production build with `bun run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
