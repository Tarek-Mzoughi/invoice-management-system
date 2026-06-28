# Invoice Management System

A full-stack web application for managing commercial documents, payments, contacts, products, company settings, dashboards, users, roles, and permissions.

The project is organized as a professional monorepo with a Next.js frontend and a NestJS backend API.

## Project Overview

Invoice Management System centralizes the full sales document lifecycle: quotations, customer orders, delivery notes, goods issue notes, invoices, credit notes, return notes, payments, and treasury tracking.

It includes authentication, role-based access control, document sequencing, PDF/document generation, multilingual support, dashboards, activity logs, and configurable company settings.

## Main Features

- Authentication with JWT and NextAuth integration
- Role-based access control and permission matrix
- Company, cabinet, activity, user, role, and permission management
- Customer, supplier, firm, and interlocutor management
- Article, product, tax, currency, and price list management
- Quotations, customer orders, delivery notes, goods issue notes, invoices, credit notes, and return notes
- Payment tracking, withholding tax certificates, treasury accounts, and movements
- Document templates, PDF generation, file uploads, and email sending
- Dashboard analytics and activity logs
- Multi-language support
- Optional AI assistant and notification workflows

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI
- React Hook Form
- TanStack Query
- Axios
- Socket.IO client

### Backend

- NestJS
- TypeScript
- MySQL
- TypeORM
- JWT authentication
- RBAC and guards
- Swagger documentation
- Socket.IO
- MinIO/S3-compatible storage
- Mailer integration

### DevOps & Tools

- Docker Compose
- MySQL
- MinIO
- Yarn
- ESLint
- Prettier
- Jest
- Vitest

## Project Structure

```text
invoice-management-system/
├── backend/            # NestJS backend API
├── frontend/           # Next.js frontend application
├── docs/               # Project documentation, screenshots, and presentation
├── docker-compose.yml  # Local infrastructure services
├── package.json        # Root helper scripts
├── .editorconfig
├── .gitignore
├── LICENSE
└── README.md
```

## Prerequisites

- Node.js 20 or newer
- Yarn 1.x
- Docker and Docker Compose
- Git

## Quick Start

Start the local infrastructure services:

```bash
docker compose up -d
```

Create local environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Install and start the backend:

```bash
cd backend
yarn install
yarn start:dev
```

Install and start the frontend:

```bash
cd frontend
yarn install
yarn dev
```

Default local URLs:

```text
Frontend:      http://localhost:3000
Backend API:   http://localhost:8082
Swagger Docs:  http://localhost:8082/docs
MinIO Console: http://localhost:9001
```

## Useful Commands

From the repository root:

```bash
yarn dev:services       # Start MySQL and MinIO
yarn stop:services      # Stop MySQL and MinIO
yarn backend:dev        # Start NestJS in watch mode
yarn frontend:dev       # Start Next.js in development mode
yarn backend:test       # Run backend tests
yarn frontend:test      # Run frontend tests
yarn backend:seed       # Seed default backend data
```

## Environment Variables

Environment examples are provided in:

```text
backend/.env.example
frontend/.env.example
```

Real environment files must stay local and must not be committed.

## Documentation

Additional project documentation is available in:

- [Architecture](docs/architecture.md)
- [Features](docs/features.md)
- [Setup Guide](docs/setup.md)

## Project Presentation

Presentation materials used for the final jury/project defense:

- [Canva Presentation](https://canva.link/wn7yydfx45cbw49)
- [Presentation PDF](docs/presentation.pdf)

Screenshots can be added under:

```text
docs/screenshots/
```

## Security Notes

- `.env` files are excluded from Git.
- JWT secrets, SMTP credentials, S3 credentials, and AI provider keys must be changed before production use.
- Feature access is controlled through roles and permissions.
- The repository is intended to keep a clean Git history at the root level.

## Academic Context

This project was developed as part of a final-year academic project in Information Systems Development. It focuses on building a complete, scalable, and maintainable business management platform.

## Author

**Tarek Mzoughi**

Full-Stack Developer

Information Systems Development Student

## License

This project is intended for academic and portfolio purposes. See [LICENSE](LICENSE).
