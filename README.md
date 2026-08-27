# Formly

Formly is the foundation for a SaaS low-code admin panel builder. It includes Laravel Sanctum authentication, owner-isolated workspace, application and module management, and responsive application/module builder shells.

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
- `GET|POST /api/workspaces/{workspace}/applications/{application}/modules`
- `GET|PUT|PATCH|DELETE /api/workspaces/{workspace}/applications/{application}/modules/{module}`
- `PUT /api/workspaces/{workspace}/applications/{application}/modules/reorder`

Every level combines scoped nested binding, explicit parent-child validation, and model policies. Module internal table names are backend-generated metadata only; no dynamic physical tables are created in this phase.

## Verification

```bash
php artisan test
npm run build
```

Dynamic tables and fields, form building, record storage, workflows, dashboard building, and roles are intentionally reserved for later phases.
