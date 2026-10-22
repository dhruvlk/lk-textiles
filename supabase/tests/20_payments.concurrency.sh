#!/usr/bin/env bash
# Two sessions record a payment on the same invoice at the same time.
# Before DATA-001 the browser read the total, added, and wrote it back, so one
# payment was lost. record_invoice_payment() locks the row: both must count.
set -euo pipefail
DB="${TEST_DB:?}"
q() { psql -X -q -At -v ON_ERROR_STOP=1 -d "$DB" "$@"; }

q -c "select tests.seed();" >/dev/null
INV=$(q -c "select public.save_invoice(null, jsonb_build_object('company_id','c0000000-0000-0000-0000-00000000000a','customer_id','d0000000-0000-0000-0000-00000000000a','challan_number','INV-CONC','date','2026-10-01','grand_total',1000), '[{\"amount\":1000}]'::jsonb);" | tail -1)

pay() {
  q <<SQL >/dev/null
begin;
select tests.as_user('a0000000-0000-0000-0000-000000000001');
select public.record_invoice_payment('$INV', 100, '2026-10-05');
select pg_sleep(1);
commit;
SQL
}
pay & pay & wait

RECEIVED=$(q -c "select trim_scale(payment_amount_received) from challans where id = '$INV';")
ROWS=$(q -c "select count(*) from challan_payments where challan_id = '$INV';")
q -c "delete from challans where id = '$INV'; select tests.as_superuser();" >/dev/null 2>&1 || true
if [ "$RECEIVED" = "200" ] && [ "$ROWS" = "2" ]; then
  echo "ok - concurrent payments both counted (received=$RECEIVED, ledger rows=$ROWS)"
else
  echo "FAIL concurrent payments: received=$RECEIVED ledger rows=$ROWS (expected 200 / 2)"; exit 1
fi
