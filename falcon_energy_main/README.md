# Noor Transport API

This server is the shared Node.js + MySQL data layer for the existing React application. It intentionally stores the present record fields and name/code relationship rules without changing their meaning.

## Local setup

1. Create a MySQL database named `noor_transport`.
2. Copy `.env.example` to `.env` and enter its database credentials and a long `JWT_SECRET`.
3. Run `npm run db:init` to create the schema and default admin account.
4. Run `npm run server:dev` in one terminal and `npm run dev` in another.

The default initial account is `admin` / `admin123`. Change its password through User Management after first login.

## Migrating existing browser data

Before switching users to the new system, download a backup using the app's existing Backup action. With an empty MySQL database, import it using:

```powershell
npm.cmd run db:migrate-local -- "C:\path\to\NoorLPG_Backup_YYYY-MM-DD.json"
```

The importer refuses to overwrite an existing database. Keep the JSON backup until record counts and reports have been checked.

## Data model

`app_records` uses a MySQL JSON payload per existing module record, keyed by module/table name and the existing legacy ID. This deliberately retains the application's current flexible relations (for example name/code links and the existing protected-delete checks) rather than introducing foreign keys that would alter business behaviour. Each complete save is committed in one MySQL transaction.
