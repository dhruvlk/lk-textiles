/**
 * API-level integration tests: the app's own services → supabase-js → PostgREST
 * (capped at 1,000 rows like Supabase) → Postgres with every migration applied.
 * Run with supabase/tests/run-api.sh; never against a real project.
 */
import test, { before } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { signJwt } from "./jwt";

const OWNER = "a0000000-0000-0000-0000-000000000001";
const VIEWER = "a0000000-0000-0000-0000-000000000002";
const COMPANY = "c0000000-0000-0000-0000-00000000000a";
const CUSTOMER = "d0000000-0000-0000-0000-00000000000a";
const STOCK = "e0000000-0000-0000-0000-00000000000a";
const STOCK_2 = "e0000000-0000-0000-0000-00000000000c";

function sql(query: string): string {
  return execFileSync("psql", ["-X", "-At", "-v", "ON_ERROR_STOP=1", "-d", process.env.IT_DB!, "-c", query], {
    encoding: "utf8",
  }).trim();
}

function actAs(userId: string) {
  process.env.IT_JWT = signJwt({ sub: userId, role: "authenticated" }, process.env.IT_JWT_SECRET!);
}

// 5,000 invoices spread over FY 2025-26, so every report crosses the 1,000-row cap.
before(() => {
  sql(`insert into challans (company_id, customer_id, challan_number, date, status, grand_total, payment_amount_received)
       select '${COMPANY}', '${CUSTOMER}', 'BULK-' || g, date '2025-04-01' + (g % 365), 'Pending',
              (g % 97) * 10 + 0.5, (g % 3) * 5
       from generate_series(1, 5000) g;`);
});

test("reports total all 5,000 invoices, not the first 1,000", async () => {
  actAs(OWNER);
  const { getReportsBundle } = await import("@/services/reports.service");
  const bundle = await getReportsBundle(COMPANY, { period: "all" });
  const sqlTotal = Number(sql(`select sum(grand_total) from challans where company_id = '${COMPANY}' and status <> 'Cancelled'`));
  const sqlPending = Number(sql(`select sum(greatest(grand_total - payment_amount_received, 0)) from challans where company_id = '${COMPANY}' and status <> 'Cancelled'`));
  assert.ok(Math.abs(bundle.kpis.totalSales - sqlTotal) < 0.01, `report ${bundle.kpis.totalSales} vs SQL ${sqlTotal}`);
  assert.ok(Math.abs(bundle.kpis.pendingPayments - sqlPending) < 0.01, `pending ${bundle.kpis.pendingPayments} vs SQL ${sqlPending}`);
});

test("year-end review totals the whole financial year", async () => {
  actAs(OWNER);
  const { getYearEndReviewData } = await import("@/services/financial-years.service");
  const review = await getYearEndReviewData(COMPANY, "2025-26");
  const sqlTotal = Number(sql(`select sum(grand_total) from challans where company_id = '${COMPANY}' and date between '2025-04-01' and '2026-03-31' and status <> 'Cancelled'`));
  const sqlCount = Number(sql(`select count(*) from challans where company_id = '${COMPANY}' and date between '2025-04-01' and '2026-03-31' and status <> 'Cancelled'`));
  assert.equal(review.sales.totalInvoices, sqlCount);
  assert.ok(Math.abs(review.sales.totalSales - sqlTotal) < 0.01, `year-end ${review.sales.totalSales} vs SQL ${sqlTotal}`);
});

test("invoice create, payment and edit go through the transactional RPCs", async () => {
  actAs(OWNER);
  const { addChallan, updateChallan } = await import("@/services/challans.service");
  const { recordChallanPayment } = await import("@/services/challan-payments.service");

  const created = await addChallan(
    {
      company_id: COMPANY,
      customer_id: CUSTOMER,
      challan_number: "IT-INV-1",
      date: "2026-10-10",
      status: "Pending",
      cgst_percent: 2.5,
      sgst_percent: 2.5,
      igst_percent: 0,
      items: [
        { quality: "Q1", quantity_display: "100 Mts", rate: 10, amount: 1000 },
        { quality: "Q2", quantity_display: "50 Mts", rate: 10, amount: 500 },
      ],
    } as never,
    OWNER
  );
  assert.equal(created.items?.length, 2);
  assert.equal(created.grand_total, 1575);

  const paid = await recordChallanPayment({
    challanId: created.id,
    companyId: COMPANY,
    amount: 575,
    paymentDate: "2026-10-11",
    paymentMode: "UPI",
  });
  assert.equal(paid.payment_amount_received, 575);
  assert.equal(paid.payment_status, "Partially Paid");

  await assert.rejects(
    recordChallanPayment({ challanId: created.id, companyId: COMPANY, amount: 5000, paymentDate: "2026-10-12" }),
    /exceeds remaining balance/
  );

  const edited = await updateChallan({ ...created, items: [{ ...created.items![0], amount: 600 }] } as never);
  assert.equal(edited.items?.length, 1);
  assert.equal(edited.payment_amount_received, 575, "payments survive an edit");
  assert.equal(edited.grand_total, 630);
});

test("delivery challan create / move / delete keep stock in step", async () => {
  actAs(OWNER);
  const dc = await import("@/services/delivery-challans.service");
  const stockQty = () => Number(sql(`select sold_taka from stocks where id = '${STOCK}'`));
  const stock2Qty = () => Number(sql(`select sold_taka from stocks where id = '${STOCK_2}'`));

  const created = await dc.addDeliveryChallan(
    {
      company_id: COMPANY,
      customer_id: CUSTOMER,
      challan_number: "IT-DC-1",
      date: "2026-10-10",
      stock_id: STOCK,
      status: "Pending",
      items: [
        { taka_no: "1", meters: 100, weight: 20 },
        { taka_no: "2", meters: 100, weight: 20 },
        { taka_no: "", meters: 0, weight: 0 },
      ],
    },
    OWNER
  );
  assert.equal(created.total_pieces, 2);
  assert.equal(stockQty(), 2);

  await assert.rejects(
    dc.addDeliveryChallan({
      company_id: COMPANY, customer_id: CUSTOMER, challan_number: "IT-DC-BIG", date: "2026-10-10",
      stock_id: STOCK_2, status: "Pending",
      items: Array.from({ length: 11 }, (_, i) => ({ taka_no: String(i + 1), meters: 1, weight: 1 })),
    }),
    /Only 10(\.00)? Taka Available/
  );
  assert.equal(sql(`select count(*) from delivery_challans where challan_number = 'IT-DC-BIG'`), "0");

  await dc.updateDeliveryChallan(created.id, {
    company_id: COMPANY, customer_id: CUSTOMER, challan_number: "IT-DC-1", date: "2026-10-10",
    stock_id: STOCK_2, status: "Pending", items: [{ taka_no: "1", meters: 1, weight: 1 }],
  });
  assert.equal(stockQty(), 0);
  assert.equal(stock2Qty(), 1);

  await dc.deleteDeliveryChallan(created.id);
  assert.equal(stock2Qty(), 0);
});

test("stock total edit and purchase create/delete", async () => {
  actAs(OWNER);
  const { updateStock } = await import("@/services/stocks.service");
  const { createPurchase, deletePurchase } = await import("@/services/purchases.service");

  const stock = await updateStock(STOCK, { company_id: COMPANY, quality_name: "Quality A1", total_taka: 30 } as never);
  assert.equal(stock.total_taka, 30);
  assert.equal(sql(`select count(*) from stock_movements where stock_id = '${STOCK}' and transaction_type = 'Manual Stock Adjustment'`), "1");

  const bill = await createPurchase(
    COMPANY,
    {
      supplier_id: null, supplier_name: "IT Supplier", supplier_gstin: null, invoice_number: "IT-PB-1",
      invoice_date: "2026-10-10", due_date: null, financial_year: "2026-27", purchase_type: "Stock Purchase",
      is_gst_bill: true, hsn_sac: null, subtotal: 1000, discount: 0, gst_rate: 5, cgst_amount: 25,
      sgst_amount: 25, igst_amount: 0, total_gst: 50, round_off: 0, grand_total: 1050,
      payment_status: "Partially Paid", paid_amount: 400, balance_amount: 650, payment_method: "UPI",
      status: "Active", notes: null, created_by: OWNER,
    } as never,
    [{ item_name: "Yarn", stock_id: STOCK, quantity: 5, unit: "Kg", rate: 200, total_amount: 1050 } as never],
    { userId: OWNER, initialPayment: { amount: 400, method: "UPI" as never } }
  );
  assert.equal(bill.paid_amount, 400, "initial payment counted once");
  assert.equal(bill.balance_amount, 650);
  assert.equal(Number(sql(`select total_taka from stocks where id = '${STOCK}'`)), 35);

  await deletePurchase(COMPANY, bill.id, OWNER);
  assert.equal(Number(sql(`select total_taka from stocks where id = '${STOCK}'`)), 30);
});

test("view-only employee is refused by the database, not just the UI", async () => {
  actAs(VIEWER);
  const { addChallan } = await import("@/services/challans.service");
  await assert.rejects(
    addChallan(
      { company_id: COMPANY, customer_id: CUSTOMER, challan_number: "IT-VIEWER", date: "2026-10-10", status: "Pending", items: [] } as never,
      VIEWER
    ),
    /row-level security/
  );
  assert.equal(sql(`select count(*) from challans where challan_number = 'IT-VIEWER'`), "0");
});

test("purchase payment updates the bill with its ledger row", async () => {
  actAs(OWNER);
  const { createPurchase, addPurchasePayment, getPurchaseById } = await import("@/services/purchases.service");
  const bill = await createPurchase(
    COMPANY,
    {
      supplier_id: null, supplier_name: "IT Supplier 2", supplier_gstin: null, invoice_number: "IT-PB-PAY",
      invoice_date: "2026-10-10", due_date: null, financial_year: "2026-27", purchase_type: "Expense Purchase",
      is_gst_bill: false, hsn_sac: null, subtotal: 1000, discount: 0, gst_rate: 0, cgst_amount: 0,
      sgst_amount: 0, igst_amount: 0, total_gst: 0, round_off: 0, grand_total: 1000,
      payment_status: "Unpaid", paid_amount: 0, balance_amount: 1000, payment_method: null,
      status: "Active", notes: null, created_by: OWNER,
    } as never,
    [{ item_name: "Service", quantity: 1, unit: "Nos", rate: 1000, total_amount: 1000 } as never],
    { userId: OWNER }
  );
  const payment = await addPurchasePayment(COMPANY, bill.id, { amount: 250, payment_method: "UPI" as never });
  assert.equal(payment.amount, 250);
  const after = await getPurchaseById(COMPANY, bill.id);
  assert.equal(after?.paid_amount, 250);
  assert.equal(after?.balance_amount, 750);
  assert.equal(after?.payment_status, "Partially Paid");
});

test("a forbidden delete reports an error instead of 'deleted'", async () => {
  actAs(VIEWER);
  const { deleteCustomer } = await import("@/services/customers.service");
  await assert.rejects(deleteCustomer(CUSTOMER), /do not have permission to delete this customer/);
  assert.equal(sql(`select count(*) from customers where id = '${CUSTOMER}'`), "1");
});

test("the private schema with the raw stock helpers is not exposed by the API", async () => {
  actAs(OWNER);
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/process_quality_stock_change`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Profile": "private",
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      Authorization: `Bearer ${process.env.IT_JWT}`,
    },
    body: JSON.stringify({ p_company_id: COMPANY, p_stock_id: STOCK, p_delta: 1, p_transaction_type: "Sale" }),
  });
  assert.equal(res.status, 406, "PostgREST must refuse a non-exposed schema");
});
