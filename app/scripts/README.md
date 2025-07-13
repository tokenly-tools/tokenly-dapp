# Local D1 + Prisma Setup Scripts

This directory contains scripts to help set up and manage your local Wrangler D1 database with Prisma.

## Scripts

### `init-local-db.sh`

A comprehensive initialization script that sets up your local development environment with Wrangler D1 and Prisma.

#### What it does:

1. **Dependency Check**: Verifies that Wrangler and Node.js are installed
2. **Environment Setup**: Creates a `.env` file with local database configuration
3. **Database Setup**: Configures local D1 database using existing wrangler.toml configuration
4. **Prisma Setup**: Generates the Prisma client
5. **Migrations**: Runs Prisma migrations to set up the database schema
6. **Seeding**: Adds sample data to the database

#### Usage:

```bash
# From the app directory
npm run init:local

# Or run the script directly
./scripts/init-local-db.sh
```

#### Prerequisites:

- Node.js installed
- Wrangler CLI installed (`npm install -g wrangler`)
- All npm dependencies installed (`npm install`)

### Database Reset

To completely reset your local database:

```bash
npm run db:reset
```

This will:
1. Delete the existing local D1 database
2. Re-run the full initialization process

## Environment Variables

The script creates a `.env` file with:

```env
# Database URL for local D1
DATABASE_URL="file:./prisma/db.sqlite"

# Wrangler D1 binding
D1_DATABASE_BINDING="DB"
```

## Troubleshooting

### Common Issues:

1. **Wrangler not found**: Install Wrangler globally with `npm install -g wrangler`
2. **Permission denied**: Make sure the script is executable: `chmod +x scripts/init-local-db.sh`
3. **Database already exists**: The script will skip creation if the database already exists
4. **Migration errors**: Check your Prisma schema and ensure all models are properly defined

### Manual Steps:

If the script fails, you can run the steps manually:

```bash
# 1. Generate Prisma client
npx prisma generate

# 2. Run migrations
npx prisma migrate deploy

# 3. Test local D1 connection
wrangler d1 execute tokenly --local --command "SELECT 1"
```

## Development Workflow

1. **First time setup**: Run `npm run init:local`
2. **Start development**: Run `npm run dev`
3. **Database changes**: Update your Prisma schema and run `npx prisma migrate dev`
4. **Reset database**: Run `npm run db:reset` if needed

## Notes

- The local D1 database is stored in your local Wrangler configuration
- The script includes sample data seeding for testing
- All operations are performed locally and won't affect production data
- The script is idempotent - it's safe to run multiple times 