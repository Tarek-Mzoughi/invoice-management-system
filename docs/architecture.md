# Architecture

## Overview

The project is organized as a full-stack monorepo:

- `frontend/` contains the Next.js application used by end users.
- `backend/` contains the NestJS API, business modules, database access, migrations, seeders, authentication, authorization, and integrations.
- `docs/` contains project documentation and presentation assets.

## Frontend

The frontend uses Next.js with TypeScript. The application is split into pages, domain features, reusable components, API clients, shared hooks, and typed models.

Key responsibilities:

- Render business workflows for selling, buying, contacts, payments, treasury, dashboard, settings, and administration.
- Communicate with the backend through Axios API clients.
- Store authentication state and active cabinet context.
- Enforce UI-level permission checks for guarded navigation and actions.
- Provide multilingual UI behavior through i18n configuration.

## Backend

The backend uses NestJS with TypeScript and TypeORM. Business capabilities are organized into modules such as authentication, users, permissions, firms, articles, documents, payments, templates, dashboard, treasury, and AI.

Key responsibilities:

- Expose REST endpoints for public, admin, callback, and test routes.
- Validate DTOs through class-validator and global validation pipes.
- Protect routes using JWT, guards, and permission checks.
- Run database migrations when synchronization is disabled.
- Store files locally or through S3-compatible storage.
- Generate and manage commercial documents and templates.
- Emit real-time events through Socket.IO.

## Data and Storage

The default local setup uses:

- MySQL for relational business data.
- MinIO for S3-compatible object storage.
- Local uploads when `STORAGE_DRIVER=local`.

## Security Model

Authentication is token-based. Access control combines roles, permissions, guards, cabinet context, and frontend route/action checks.

Production deployments must replace all example secrets, restrict CORS, configure HTTPS, and use secure SMTP/S3 credentials.
