# Setup Guide

## 1. Start Local Services

From the repository root:

```bash
docker compose up -d
```

This starts MySQL and MinIO with the same credentials used by `backend/.env.example`.

## 2. Configure the Backend

```bash
cp backend/.env.example backend/.env
cd backend
yarn install
yarn start:dev
```

The backend starts on:

```text
http://localhost:8082
```

Swagger documentation is available at:

```text
http://localhost:8082/docs
```

When `DATABASE_SYNCHRONIZE=false`, the backend runs the migration flow during startup.

Optional seed command:

```bash
yarn seed:all
```

## 3. Configure the Frontend

```bash
cp frontend/.env.example frontend/.env.local
cd frontend
yarn install
yarn dev
```

The frontend starts on:

```text
http://localhost:3000
```

## 4. Useful Local URLs

```text
Frontend:      http://localhost:3000
Backend API:   http://localhost:8082
Swagger Docs:  http://localhost:8082/docs
MinIO API:     http://localhost:9000
MinIO Console: http://localhost:9001
MySQL:         localhost:3306
```

## 5. Before Publishing

- Keep the repository private if it contains the full source code.
- Do not commit real `.env` files.
- Replace all example secrets before deployment.
- Add screenshots to `docs/screenshots/` for portfolio presentation.
- Use the README GitHub description for a concise project summary.
