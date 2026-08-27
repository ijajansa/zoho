# Formly

Formly is the foundation for a SaaS low-code admin panel builder. This phase includes Laravel Sanctum authentication, owner-isolated workspace management, and a responsive React dashboard.

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

Workspace access is enforced through `WorkspacePolicy`; list queries are also scoped through the authenticated user's relationship.

## Verification

```bash
php artisan test
npm run build
```

Applications, modules, form building, workflows, dashboards, and roles are intentionally reserved for later phases.
