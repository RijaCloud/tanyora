#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 4 ]; then
  echo "Usage: $0 <database-name> <database-user> <database-password> <database-host> [wp-version]"
  exit 1
fi

DB_NAME=$1; DB_USER=$2; DB_PASS=$3; DB_HOST=$4; WP_VERSION=${5:-latest}
WP_TESTS_DIR=${WP_TESTS_DIR:-/tmp/wordpress-tests-lib}
WP_CORE_DIR=${WP_CORE_DIR:-/tmp/wordpress/}

if [ ! -d "$WP_TESTS_DIR" ]; then
  svn co --quiet https://develop.svn.wordpress.org/trunk/tests/phpunit/includes/ "$WP_TESTS_DIR/includes"
  svn co --quiet https://develop.svn.wordpress.org/trunk/tests/phpunit/data/ "$WP_TESTS_DIR/data"
fi
if [ ! -f "$WP_CORE_DIR/wp-load.php" ]; then
  mkdir -p "$WP_CORE_DIR"
  if [ "$WP_VERSION" = "latest" ]; then curl -sSL https://wordpress.org/latest.tar.gz | tar xz --strip-components=1 -C "$WP_CORE_DIR"; else curl -sSL "https://wordpress.org/wordpress-${WP_VERSION}.tar.gz" | tar xz --strip-components=1 -C "$WP_CORE_DIR"; fi
fi
cp "$WP_TESTS_DIR/includes/wp-tests-config-sample.php" "$WP_TESTS_DIR/wp-tests-config.php"
sed -i "s:dbnamehere:${DB_NAME}:;s:yourusernamehere:${DB_USER}:;s:yourpasswordhere:${DB_PASS}:;s:localhost:${DB_HOST}:;s:/var/www/wordpress:${WP_CORE_DIR}:" "$WP_TESTS_DIR/wp-tests-config.php"
mysqladmin --host="$DB_HOST" --user="$DB_USER" --password="$DB_PASS" create "$DB_NAME" 2>/dev/null || true
