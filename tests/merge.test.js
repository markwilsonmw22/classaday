/* The progress merge in public/assets/js/auth.js, run in a tiny fake browser. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

function loadAuth() {
  const store = new Map();
  const localStorage = {
    get length() { return store.size; }, key: (i) => [...store.keys()][i] ?? null,
    getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k),
  };
  const window = {
    SA_CONFIG: { accounts: true, live: true, supabaseUrl: "https://ref123.supabase.co", supabaseKey: "pk" },
  };
  const ctx = {
    window, localStorage, sessionStorage: localStorage, location: { pathname: "/", search: "", reload() {} },
    document: { querySelectorAll: () => [], documentElement: { classList: { toggle() {} } }, addEventListener() {}, getElementById: () => null },
    setTimeout: () => 0, setInterval: () => 0, fetch: () => Promise.reject(new Error("offline")), URLSearchParams, Promise, JSON, Date, Math, Intl,
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL("../public/assets/js/auth.js", import.meta.url), "utf8"), ctx);
  return window.SAAuth;
}

const A = loadAuth();
// Results come from another JS realm, so copy them before comparing.
const m = (...args) => JSON.parse(JSON.stringify(A._merge3(...args)));
const S = A._stable;

test("first sync on a device: everything from both sides is kept", () => {
  const local = { "sa.course.x": { done: [1, 2], tasks: { "1-0": 1 }, notes: { 1: "mine" } }, "sa.name": "Sam" };
  const remote = { "sa.course.x": { done: [2, 3], tasks: { "3-1": 1 }, notes: { 3: "theirs" } }, "sa.course.y": { done: [1] } };
  const out = m(local, remote, undefined);
  assert.deepEqual(out["sa.course.x"].done.sort(), [1, 2, 3]);
  assert.deepEqual(out["sa.course.x"].tasks, { "1-0": 1, "3-1": 1 });
  assert.deepEqual(out["sa.course.x"].notes, { 1: "mine", 3: "theirs" });
  assert.deepEqual(out["sa.course.y"], { done: [1] });
  assert.equal(out["sa.name"], "Sam");
});

test("edits on another device win when this device didn't touch that field", () => {
  const base = { c: { notes: { 1: "old" }, pace: 1 } };
  const local = { c: { notes: { 1: "old" }, pace: 2 } };
  const remote = { c: { notes: { 1: "new from phone" }, pace: 1 } };
  assert.deepEqual(m(local, remote, base), { c: { notes: { 1: "new from phone" }, pace: 2 } });
});

test("un-ticking and deleting propagate", () => {
  const base = { c: { done: [1, 2, 3], tasks: { a: 1, b: 1 } } };
  const local = { c: { done: [1, 3], tasks: { a: 1, b: 1 } } };      // un-marked day 2 here
  const remote = { c: { done: [1, 2, 3, 4], tasks: { a: 1 } } };     // finished day 4 and un-ticked b elsewhere
  assert.deepEqual(m(local, remote, base), { c: { done: [1, 3, 4], tasks: { a: 1 } } });
});

test("quiz results keep the best score and any pass", () => {
  const base = { q: { best: 60, attempts: 1, passed: false } };
  const local = { q: { best: 70, attempts: 2, passed: false, last: 70 } };
  const remote = { q: { best: 90, attempts: 2, passed: true, last: 90 } };
  const out = m(local, remote, base);
  assert.equal(out.q.best, 90);
  assert.equal(out.q.attempts, 2);
  assert.equal(out.q.passed, true);
});

test("a key deleted here stays deleted unless the other side changed it", () => {
  const base = { "sa.course.x": { done: [1] }, "sa.course.y": { done: [1] } };
  const local = {};
  const remote = { "sa.course.x": { done: [1] }, "sa.course.y": { done: [1, 2] } };
  assert.deepEqual(m(local, remote, base), { "sa.course.y": { done: [1, 2] } });
});

test("stable stringify ignores key order (Postgres reorders JSON keys)", () => {
  assert.equal(S({ b: 1, a: { d: [1, 2], c: null } }), S({ a: { c: null, d: [1, 2] }, b: 1 }));
  assert.notEqual(S({ a: [1, 2] }), S({ a: [2, 1] }));
});

test("merging is stable: a second merge with the result changes nothing", () => {
  const local = { c: { done: [1, 2], notes: { 1: "a" } } }, remote = { c: { done: [3], feel: { 1: "ok" } } };
  const once = m(local, remote, undefined);
  assert.equal(S(m(once, once, once)), S(once));
});
