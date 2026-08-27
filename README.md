# Formly

Formly is the foundation for a SaaS low-code admin panel builder. It includes Laravel Sanctum authentication, owner-isolated workspace and application management, and a responsive React dashboard and builder shell.

## Stack

- Laravel 12 and Laravel Sanctum
- PHP 8.3+
- MySQL
- React 19, React Router, Vite, and Tailwind CSS 4

## Local setup

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
npm install
npm run build
```

Set the MySQL connection values in `.env`, then run the application:

```bash
composer run dev
```

## API

Public endpoints:

- `POST /api/register`
- `POST /api/login`

Bearer-token protected endpoints:

- `GET /api/user`
- `POST /api/logout`
- `GET|POST /api/workspaces`
- `GET|PUT|PATCH|DELETE /api/workspaces/{workspace}`
- `GET|POST /api/workspaces/{workspace}/applications`
- `GET|PUT|PATCH|DELETE /api/workspaces/{workspace}/applications/{application}`

Workspace access is enforced through `WorkspacePolicy`; application routes combine scoped nested binding, explicit parent-child validation, and `ApplicationPolicy` authorization.

## Verification

```bash
php artisan test
npm run build
```

Modules, dynamic tables and fields, form building, workflows, dashboard building, and roles are intentionally reserved for later phases.
