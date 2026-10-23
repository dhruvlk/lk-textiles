import test from "node:test";
import assert from "node:assert/strict";
import { numberToWords } from "../lib/number-to-words";
import { isBlankTakaRow } from "../lib/challan-item";
import { actionFromPathname, moduleFromPathname } from "../constants/permissions";
import { toLocalISODate } from "../lib/dates";

test("numberToWords handles whole rupees (unchanged format)", () => {
  assert.equal(numberToWords(0), "Zero");
  assert.equal(numberToWords(1051), "Rupees One Thousand Fifty One Only");
  assert.equal(numberToWords(2550000), "Rupees Twenty Five Lakh Fifty Thousand Only");
  assert.equal(numberToWords(10000000), "Rupees One Crore Only");
});

test("numberToWords handles paise instead of printing 'undefined'", () => {
  const words = numberToWords(1051.05);
  assert.equal(words, "Rupees One Thousand Fifty One and Five Paise Only");
  assert.ok(!words.includes("undefined"));
  assert.equal(numberToWords(0.5), "Rupees Zero and Fifty Paise Only");
});

test("numberToWords handles 100 crore and above", () => {
  const words = numberToWords(1_500_000_000); // 150 crore
  assert.equal(words, "Rupees One Hundred Fifty Crore Only");
  assert.ok(!words.includes("undefined"));
});

test("isBlankTakaRow only flags rows with no data", () => {
  assert.equal(isBlankTakaRow({ taka_no: "", meters: 0, weight: 0 }), true);
  assert.equal(isBlankTakaRow({ taka_no: "  ", meters: "", weight: null }), true);
  assert.equal(isBlankTakaRow({ taka_no: "12", meters: 0, weight: 0 }), false);
  assert.equal(isBlankTakaRow({ taka_no: "", meters: 101.5, weight: 0 }), false);
  assert.equal(isBlankTakaRow({ taka_no: "", meters: 0, weight: 20 }), false);
});

test("route permissions require create/edit on form routes", () => {
  assert.equal(moduleFromPathname("/admin/invoices/new"), "invoices");
  assert.equal(actionFromPathname("/admin/invoices/new"), "create");
  assert.equal(actionFromPathname("/admin/letter-pads/create"), "create");
  assert.equal(actionFromPathname("/admin/salary-slips/abc/edit"), "edit");
  assert.equal(actionFromPathname("/admin/salary-slips/abc"), "view");
  assert.equal(actionFromPathname("/admin/invoices/abc/print"), "view");
  assert.equal(moduleFromPathname("/admin"), "dashboard");
});

test("toLocalISODate uses the local calendar date, not UTC", () => {
  // 00:30 local time on 1 Oct must be 1 Oct regardless of timezone offset.
  assert.equal(toLocalISODate(new Date(2026, 9, 1, 0, 30)), "2026-10-01");
  assert.equal(toLocalISODate(new Date(2026, 2, 31, 23, 59)), "2026-03-31");
});
