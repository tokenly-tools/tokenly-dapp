#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler is not installed. Please install it first: npm install -g wrangler"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Create local D1 database
create_local_db() {
    print_status "Setting up local D1 database..."
    
    # For local development, we use the database ID from wrangler.toml
    # The database is created in the cloud but we can use it locally
    print_status "Using existing database configuration from wrangler.toml"
    
    # Check if we can connect to the database
    if wrangler d1 execute tokenly --local --command "SELECT 1" &> /dev/null; then
        print_success "Local D1 database connection successful"
    else
        print_warning "Local database connection failed. This might be normal for first-time setup."
        print_status "The database will be created when you first run a migration or query."
    fi
}

# Generate Prisma client
generate_prisma_client() {
    print_status "Generating Prisma client..."
    
    npx prisma generate
    
    if [ $? -eq 0 ]; then
        print_success "Prisma client generated successfully"
    else
        print_error "Failed to generate Prisma client"
        exit 1
    fi
}

# Run Prisma migrations
run_migrations() {
    print_status "Running Prisma migrations..."
    
    # Create migration if it doesn't exist
    if [ ! -d "prisma/migrations" ] || [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then
        print_status "Creating initial migration..."
        npx prisma migrate dev --name init --create-only
    fi
    
    # For D1, we need to apply migrations using wrangler
    print_status "Applying migrations to D1 database..."
    
    # Get the latest migration file
    LATEST_MIGRATION=$(ls -t prisma/migrations/*/migration.sql | head -1)
    
    if [ -n "$LATEST_MIGRATION" ]; then
        wrangler d1 execute tokenly --local --file="$LATEST_MIGRATION"
        
        if [ $? -eq 0 ]; then
            print_success "Migrations applied successfully to D1"
        else
            print_error "Failed to apply migrations to D1"
            exit 1
        fi
    else
        print_warning "No migration files found"
    fi
}

# Seed the database (optional)
seed_database() {
    print_status "Seeding database with sample data..."
    
    # Create a temporary SQL file for seeding
    cat > temp_seed.sql << 'EOF'
INSERT OR REPLACE INTO "User" ("id", "email", "name") VALUES 
(1, 'john@example.com', 'John Doe'),
(2, 'jane@example.com', 'Jane Smith');
EOF

    # Apply the seed data to D1
    wrangler d1 execute tokenly --local --file=temp_seed.sql
    
    if [ $? -eq 0 ]; then
        print_success "Database seeded successfully"
    else
        print_warning "Failed to seed database (this is optional)"
    fi
    
    # Clean up temporary file
    rm temp_seed.sql
}

# Set up environment variables
setup_env() {
    print_status "Setting up environment variables..."
    
    # Create .env file if it doesn't exist
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# Database URL for local D1
DATABASE_URL="file:./prisma/db.sqlite"

# Wrangler D1 binding
D1_DATABASE_BINDING="DB"
EOF
        print_success "Created .env file with local database configuration"
    else
        print_warning ".env file already exists, skipping creation"
    fi
}

# Main execution
main() {
    print_status "Starting local D1 + Prisma initialization..."
    
    # Change to the app directory if not already there
    if [ ! -f "wrangler.toml" ]; then
        if [ -d "app" ]; then
            cd app
        else
            print_error "Could not find wrangler.toml. Please run this script from the app directory."
            exit 1
        fi
    fi
    
    check_dependencies
    setup_env
    create_local_db
    generate_prisma_client
    run_migrations
    seed_database
    
    print_success "Local D1 + Prisma setup completed successfully!"
    print_status "You can now run your application with: npm run dev"
    print_status "To start the local D1 database: wrangler d1 execute tokenly --local"
}

# Run main function
main "$@" 