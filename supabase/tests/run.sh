#!/usr/bin/env bash
# Database test suite: builds a scratch database from every migration, then runs
# each tests/*.test.sql file in its own rolled-back transaction.
#
#   supabase/tests/run.sh            # uses PGHOST/PGPORT/PGUSER (superuser)
#
# Needs only a plain PostgreSQL 15+ server; Supabase platform objects (auth,
# storage, API roles) are stubbed by 00_supabase_stub.sql. Never point this at a
# real Supabase project: it drops and recreates the target database.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS="$DIR/../migrations"
DB="${TEST_DB:-challan_test}"
export PGUSER="${PGUSER:-postgres}"

dropdb --if-exists "$DB" >/dev/null 2>&1 || true
createdb "$DB"
psql -q -X -v ON_ERROR_STOP=1 -d "$DB" -f "$DIR/00_supabase_stub.sql" >/dev/null
for f in "$MIGRATIONS"/*.sql; do
  if ! out=$(psql -q -X -v ON_ERROR_STOP=1 -d "$DB" -f "$f" 2>&1); then
    echo "Migration failed: $(basename "$f")"; echo "$out" | grep -v NOTICE | tail -5; exit 1
  fi
done
echo "Applied $(ls "$MIGRATIONS"/*.sql | wc -l) migrations"
psql -q -X -v ON_ERROR_STOP=1 -d "$DB" -f "$DIR/01_helpers.sql" >/dev/null

pass=0; fail=0
for t in "$DIR"/*.test.sql; do
  name="$(basename "$t")"
  if out=$( { echo "begin; select tests.seed();"; cat "$t"; echo "rollback;"; } \
            | psql -X -v ON_ERROR_STOP=1 -d "$DB" 2>&1); then
    n=$(echo "$out" | grep -c "NOTICE:  ok - " || true)
    echo "PASS $name ($n assertions)"; pass=$((pass + 1))
  else
    echo "FAIL $name"; echo "$out" | grep -E "ERROR|FAIL" | head -5; fail=$((fail + 1))
  fi
done

for s in "$DIR"/*.concurrency.sh; do
  [ -e "$s" ] || continue
  if TEST_DB="$DB" bash "$s"; then echo "PASS $(basename "$s")"; pass=$((pass + 1));
  else echo "FAIL $(basename "$s")"; fail=$((fail + 1)); fi
done

echo "Database tests: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
