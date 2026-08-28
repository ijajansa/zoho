# Formly

Formly is the foundation for a SaaS low-code admin panel builder. It includes Laravel Sanctum authentication, owner-isolated workspace, application and module management, a metadata-driven drag-and-drop form builder, and controlled physical schema publishing.

## Stack

- Laravel 12 and Laravel Sanctum
- PHP 8.3+
- MySQL
- React 19, React Router, Vite, and Tailwind CSS 4
- dnd-kit for accessible field creation and ordering

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
- `GET /api/field-types`
- `GET|POST /api/workspaces/{workspace}/applications/{application}/modules/{module}/fields`
- `GET|PUT|DELETE /api/workspaces/{workspace}/applications/{application}/modules/{module}/fields/{field}`
- `PUT /api/workspaces/{workspace}/applications/{application}/modules/{module}/fields/reorder`
- `PUT /api/workspaces/{workspace}/applications/{application}/modules/{module}/form`
- `GET /api/workspaces/{workspace}/applications/{application}/modules/{module}/schema`
- `POST /api/workspaces/{workspace}/applications/{application}/modules/{module}/schema/publish`
- `GET /api/workspaces/{workspace}/applications/{application}/modules/{module}/schema/history`

Every level combines scoped nested binding, explicit parent-child validation, and model policies. The bulk form endpoint validates the complete field set and persists creates, updates, deletes, and ordering in one transaction.

Module and field metadata remain the source of truth. Physical tables are created only through the explicit schema publish endpoint; the engine validates identifiers and types, records versioned history, safely synchronizes additions and supported modifications, and never drops archived published columns.

## Verification

```bash
php artisan test
npm run build
```

Record storage, relationships, workflows, dashboard building, and roles are intentionally reserved for later phases.
