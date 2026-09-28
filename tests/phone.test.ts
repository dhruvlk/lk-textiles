import test from "node:test";
import assert from "node:assert/strict";
import { formatCompanyPhone, cleanPhoneDigits } from "../lib/validations/phone";

test("formatCompanyPhone - valid 10-digit Indian number", () => {
  assert.equal(formatCompanyPhone("9828121931"), "+91 9828121931");
  assert.equal(formatCompanyPhone("+919828121931"), "+91 9828121931");
});

test("formatCompanyPhone - already formatted", () => {
  assert.equal(formatCompanyPhone("+91 9828121931"), "+91 9828121931");
});

test("formatCompanyPhone - empty or null returns empty string", () => {
  assert.equal(formatCompanyPhone(null), "");
  assert.equal(formatCompanyPhone(undefined), "");
  assert.equal(formatCompanyPhone(""), "");
  assert.equal(formatCompanyPhone("   "), "");
});

test("formatCompanyPhone - different company numbers format correctly without hardcoding", () => {
  // Company B
  assert.equal(formatCompanyPhone("9876543210"), "+91 9876543210");
  assert.equal(formatCompanyPhone("+919876543210"), "+91 9876543210");
  assert.equal(formatCompanyPhone("+91 9876543210"), "+91 9876543210");

  // Company C
  assert.equal(formatCompanyPhone("9012345678"), "+91 9012345678");
  assert.equal(formatCompanyPhone("+919012345678"), "+91 9012345678");
});

test("cleanPhoneDigits - extracts 10 digits correctly across formats", () => {
  assert.equal(cleanPhoneDigits("9828121931"), "9828121931");
  assert.equal(cleanPhoneDigits("+91 9828121931"), "9828121931");
  assert.equal(cleanPhoneDigits("+919828121931"), "9828121931");
  assert.equal(cleanPhoneDigits("919828121931"), "9828121931");
  assert.equal(cleanPhoneDigits("09828121931"), "9828121931");
  assert.equal(cleanPhoneDigits(null), "");
  assert.equal(cleanPhoneDigits(""), "");
});
