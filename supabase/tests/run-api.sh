#!/usr/bin/env bash
# API-level integration tests: a real PostgREST (the API layer Supabase runs)
# over a scratch database built from the migrations, with the app's own
# TypeScript services calling it through supabase-js.
#
# Needs: PostgreSQL superuser via PGHOST/PGPORT/PGUSER, and a PostgREST binary
# on PATH or in $POSTGREST_BIN. Never point this at a real Supabase project.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DB="${IT_DB:-challan_it}"
export PGUSER="${PGUSER:-postgres}"
POSTGREST_BIN="${POSTGREST_BIN:-postgrest}"
JWT_SECRET="it-only-secret-0123456789abcdefghijklmnop"
PG_PORT_REST=3999; PROXY_PORT=54321

dropdb --if-exists "$DB" >/dev/null 2>&1 || true
createdb "$DB"
psql -q -X -v ON_ERROR_STOP=1 -d "$DB" -f "$ROOT/supabase/tests/00_supabase_stub.sql" >/dev/null
for f in "$ROOT"/supabase/migrations/*.sql; do psql -q -X -v ON_ERROR_STOP=1 -d "$DB" -f "$f" >/dev/null 2>&1 || { echo "Migration failed: $f"; exit 1; }; done
psql -q -X -v ON_ERROR_STOP=1 -d "$DB" -f "$ROOT/supabase/tests/01_helpers.sql" >/dev/null
psql -q -X -v ON_ERROR_STOP=1 -d "$DB" <<'SQL' >/dev/null
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then
    create role authenticator login noinherit;
  end if;
end $$;
alter role authenticator password 'it-only-authenticator';
grant anon, authenticated, service_role to authenticator;
select tests.seed();
SQL

PG_HOST="${PGHOST:-/var/run/postgresql}"
if [[ "$PG_HOST" == /* ]]; then
  DB_URI="postgres://authenticator:it-only-authenticator@/$DB?host=$PG_HOST&port=${PGPORT:-5432}"
else
  DB_URI="postgres://authenticator:it-only-authenticator@$PG_HOST:${PGPORT:-5432}/$DB"
fi
CONF="$(mktemp)"
cat > "$CONF" <<CONF
db-uri = "$DB_URI"
db-schemas = "public"
db-anon-role = "anon"
db-max-rows = 1000
jwt-secret = "$JWT_SECRET"
server-host = "127.0.0.1"
server-port = $PG_PORT_REST
CONF
"$POSTGREST_BIN" "$CONF" > /tmp/postgrest-it.log 2>&1 &
PGRST_PID=$!
node "$ROOT/tests/integration/rest-proxy.mjs" "$PROXY_PORT" "$PG_PORT_REST" &
PROXY_PID=$!
trap 'kill $PGRST_PID $PROXY_PID 2>/dev/null || true; rm -f "$CONF"' EXIT
for _ in $(seq 1 50); do curl -s "http://127.0.0.1:$PG_PORT_REST/" >/dev/null 2>&1 && break; sleep 0.2; done

export NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:$PROXY_PORT"
export IT_JWT_SECRET="$JWT_SECRET" IT_DB="$DB"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$(node -e "
const c=require('crypto');const e=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const h=e({alg:'HS256',typ:'JWT'}),b=e({role:'anon',exp:Math.floor(Date.now()/1000)+3600});
console.log(h+'.'+b+'.'+c.createHmac('sha256','$JWT_SECRET').update(h+'.'+b).digest('base64url'))")"
cd "$ROOT"
TZ=Asia/Kolkata npx tsx --tsconfig tests/integration/tsconfig.json --test tests/integration/*.it.ts
