#!/bin/sh
set -e

# The storage volume starts empty on the first deploy: recreate Laravel's
# directories and the SQLite file before anything touches them.
mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs
DB_FILE="${DB_DATABASE:-/var/www/html/storage/app/database/portfolio.sqlite}"
mkdir -p "$(dirname "$DB_FILE")"
[ -f "$DB_FILE" ] || touch "$DB_FILE"

# Configuration comes from the container environment (clear_env = no).
php artisan migrate --force --no-interaction
php artisan config:cache
php artisan route:cache
php artisan view:cache

exec "$@"
