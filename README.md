# ShareSecret

A secure web app for sharing sensitive information with end-to-end encryption.

[GitHub](https://github.com/vieyama/share-secret)

## Features

- 🔒 End-to-end encryption (AES-256-GCM)
- 🔑 Optional password protection
- ⏱️ Configurable expiration (5min, 1hr, 24hr, 7 days)
- 👁️ View limits (1, 2, 5, or unlimited)
- 🚫 Zero server storage — secrets live in the URL

## Quick Start

```bash
bun install
bun run dev
```

## Docker Deployment

```bash
docker build -t share-secret .
docker run -d -p 5050:80 share-secret
```

## Tech Stack

React + Vite + Tailwind CSS + Web Crypto API

## License

MIT
