import test from "node:test";
import assert from "node:assert/strict";
import { fetchAllRows } from "../lib/supabase/fetch-all";

function fakeTable(total: number) {
  const calls: Array<[number, number]> = [];
  const rows = Array.from({ length: total }, (_, i) => ({ id: i }));
  const build = () => ({
    range(from: number, to: number) {
      calls.push([from, to]);
      return Promise.resolve({ data: rows.slice(from, to + 1), error: null });
    },
  });
  return { build, calls };
}

test("fetchAllRows reads past the 1,000-row cap", async () => {
  const { build, calls } = fakeTable(2500);
  const res = await fetchAllRows(build);
  assert.equal(res.error, null);
  assert.equal(res.data?.length, 2500);
  assert.deepEqual(calls, [[0, 999], [1000, 1999], [2000, 2999], [2500, 3499]]);
});

test("fetchAllRows stops on the first empty page", async () => {
  const { build, calls } = fakeTable(2000);
  const res = await fetchAllRows(build);
  assert.equal(res.data?.length, 2000);
  assert.equal(calls.length, 3);
});

test("fetchAllRows still reads everything when the server caps pages lower", async () => {
  const rows = Array.from({ length: 1500 }, (_, i) => ({ id: i }));
  const build = () => ({
    range(from: number, to: number) {
      // Server-side cap of 600 rows per response, whatever range was asked for.
      return Promise.resolve({ data: rows.slice(from, Math.min(to + 1, from + 600)), error: null });
    },
  });
  const res = await fetchAllRows(build);
  assert.equal(res.data?.length, 1500);
  assert.deepEqual(res.data?.map((r) => r.id), rows.map((r) => r.id));
});

test("fetchAllRows returns the error and no partial data", async () => {
  let n = 0;
  const build = () => ({
    range() {
      n += 1;
      return Promise.resolve(
        n === 2
          ? { data: null, error: { message: "JWT expired" } }
          : { data: Array.from({ length: 1000 }, (_, i) => ({ id: i })), error: null }
      );
    },
  });
  const res = await fetchAllRows(build);
  assert.equal(res.data, null);
  assert.deepEqual(res.error, { message: "JWT expired" });
});
